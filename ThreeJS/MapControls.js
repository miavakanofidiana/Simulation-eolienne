/**
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin 	/ http://mark-lundin.com
 */

THREE.MapControls = function ( object, domElement ) {

	var _this = this;
	var STATE = { NONE: -1, PAN: 0, ZOOM: 1, ROTATE: 'alt+0', TOUCH_PAN: 3, TOUCH_ZOOM: 4 };

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	this.enabled = true;

	this.screen = { left: 0, top: 0, width: 0, height: 0 };

	this.rotateSpeed = 1.0;
	this.zoomSpeed = 1.2;
	this.panSpeed = 60.0;

	this.noRotate = false;
	this.noZoom = false;
	this.reversed = false; // MIAVAKA
	this.noPan = false;
	this.noRoll = false;

	this.dynamicDampingFactor = 0.2;

	this.minDistance = 25;
	this.maxDistance = 1000;

	this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

	// internals

	this.target = new THREE.Vector3();
	this.surface = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

	var EPS = 0.000001;

	var lastPosition = new THREE.Vector3();

	var _state = STATE.NONE,
	_prevState = STATE.NONE,

	_eye = new THREE.Vector3(),

	_rotateStart = new THREE.Vector2(),
	_rotateEnd = new THREE.Vector2(),
	_rotateHeading = new THREE.Quaternion(),

	_zoomStart = new THREE.Vector2(),
	_zoomEnd = new THREE.Vector2(),

	_touchZoomDistanceStart = 0,
	_touchZoomDistanceEnd = 0,

	_panStart = new THREE.Vector2(),
	_panEnd = new THREE.Vector2();

	// for reset

	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.up0 = this.object.up.clone();

	// events

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start'};
	var endEvent = { type: 'end'};


	// methods

	this.handleResize = function () {

		if ( this.domElement === document ) {

			this.screen.left = 0;
			this.screen.top = 0;
			this.screen.width = window.innerWidth;
			this.screen.height = window.innerHeight;

		} else {

			var box = this.domElement.getBoundingClientRect();
			// adjustments come from similar code in the jquery offset() function
			var d = this.domElement.ownerDocument.documentElement;
			this.screen.left = box.left + window.pageXOffset - d.clientLeft;
			this.screen.top = box.top + window.pageYOffset - d.clientTop;
			this.screen.width = box.width;
			this.screen.height = box.height;

		}

	};

	this.handleEvent = function ( event ) {

		if ( typeof this[ event.type ] === 'function' ) {

			this[ event.type ]( event );

		}

	};

	var getMouseOnScreen = ( function () {

		var vector = new THREE.Vector2();

		return function ( pageX, pageY ) {

			var inv = _this.reversed ? -1 : 1; //MIAVAKA

			vector.set(
				inv*( pageX - _this.screen.left ) / _this.screen.width,
				inv*( pageY - _this.screen.top ) / _this.screen.height
			);

			return vector;

		};

	}() );

	this.rotateCamera = (function(){

		var axisX = new THREE.Vector3(1, 0, 0),
			axisY = new THREE.Vector3(0, 0, 1),
			rotateChange = new THREE.Vector2(),
			quaternionX = new THREE.Quaternion(),
			quaternionY = new THREE.Quaternion(),
			quaternionXInverse = new THREE.Quaternion(),
			quaternionYInverse = new THREE.Quaternion();


		return function () {

			rotateChange.subVectors( _rotateEnd, _rotateStart );

			if ( rotateChange.lengthSq() > EPS ) {

				quaternionXInverse = quaternionX.clone().inverse();
				quaternionYInverse = quaternionY.clone().inverse();

				// Undo previous transformation
				_eye.applyQuaternion( quaternionYInverse );
				_this.object.up.applyQuaternion( quaternionYInverse );
				_eye.applyQuaternion( quaternionXInverse );
				_this.object.up.applyQuaternion( quaternionXInverse );

				// Apply new transformations to previous state
				quaternionX = quaternionX.clone()
					.setFromAxisAngle( axisX, rotateChange.y * _this.rotateSpeed )
					.multiply(quaternionX);
				quaternionY = quaternionY.clone()
					.setFromAxisAngle( axisY, -1 * rotateChange.x * _this.rotateSpeed )
					.multiply(quaternionY);

				// Apply new transformation
				_eye.applyQuaternion( quaternionX );
				_this.object.up.applyQuaternion( quaternionX );
				_eye.applyQuaternion( quaternionY );
				_this.object.up.applyQuaternion( quaternionY );

				// Ease transitions
				_rotateStart.add( rotateChange.multiplyScalar( _this.dynamicDampingFactor ) );

				_rotateHeading.copy( quaternionY );
			}

		};

	}());

	this.zoomCamera = function () {

		var factor;

		if ( _state === STATE.TOUCH_ZOOM ) {

			factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
			_touchZoomDistanceStart = _touchZoomDistanceEnd;
			_eye.multiplyScalar( factor );

		} else {

			factor = 1.0 + ( _zoomEnd.y - _zoomStart.y ) * _this.zoomSpeed;

			if ( factor !== 1.0 && factor > 0.0 ) {

				_eye.multiplyScalar( factor );

				_zoomStart.y += ( _zoomEnd.y - _zoomStart.y ) * this.dynamicDampingFactor;

			}

		}

	};

	this.panCamera = (function(){

		var mouseChange = new THREE.Vector2(),
			surfaceStart,
			surfaceEnd,
			down = _this.surface.normal.clone().negate(),
			pan = new THREE.Vector3(),
			raycaster = new THREE.Raycaster();

		return function () {

			raycaster.set( _this.object.position, down );

			raycaster.ray.origin.x = _panStart.x * _this.panSpeed;
			raycaster.ray.origin.y = -1 * _panStart.y * _this.panSpeed;
			surfaceStart = raycaster.ray.intersectPlane( _this.surface );

			raycaster.ray.origin.x = _panEnd.x * _this.panSpeed;
			raycaster.ray.origin.y = -1 * _panEnd.y * _this.panSpeed;
			surfaceEnd = raycaster.ray.intersectPlane( _this.surface );

			if (!surfaceEnd || !surfaceStart) {
				console.log('Camera is below surface!');
				return;
			}

			mouseChange.subVectors( _panEnd, _panStart);
			pan.subVectors(surfaceEnd, surfaceStart).setLength( mouseChange.length() * _this.panSpeed );

			if ( pan.lengthSq() ) {
				pan.applyQuaternion(_rotateHeading);
				_this.object.position.add( pan );
				_this.target.add( pan );
				_panStart.add( mouseChange.multiplyScalar( _this.dynamicDampingFactor ) );
			}

		};

	}());

	this.checkDistances = function () {

		if ( !_this.noZoom || !_this.noPan ) {

			if ( _eye.lengthSq() > _this.maxDistance * _this.maxDistance ) {

				_this.object.position.addVectors( _this.target, _eye.setLength( _this.maxDistance ) );

			}

			if ( _eye.lengthSq() < _this.minDistance * _this.minDistance ) {

				_this.object.position.addVectors( _this.target, _eye.setLength( _this.minDistance ) );
				
				// Prevent zoom beyond minimum from accruing
				_zoomStart.y = 0;

			}

		}

	};

	this.update = function () {

		_eye.subVectors( _this.object.position, _this.target );

		if ( !_this.noRotate ) {

			_this.rotateCamera();

		}

		if ( !_this.noZoom ) {

			_this.zoomCamera();

		}

		if ( !_this.noPan ) {

			_this.panCamera();

		}

		_this.object.position.addVectors( _this.target, _eye );

		_this.checkDistances();

		_this.object.lookAt( _this.target );

		if ( lastPosition.distanceToSquared( _this.object.position ) > EPS ) {

			_this.dispatchEvent( changeEvent );

			lastPosition.copy( _this.object.position );

		}

	};

	this.reset = function () {

		_state = STATE.NONE;
		_prevState = STATE.NONE;

		_this.target.copy( _this.target0 );
		_this.object.position.copy( _this.position0 );
		_this.object.up.copy( _this.up0 );

		_eye.subVectors( _this.object.position, _this.target );

		_this.object.lookAt( _this.target );

		_this.dispatchEvent( changeEvent );

		lastPosition.copy( _this.object.position );

	};

	// listeners

	function keydown( event ) {

		if ( _this.enabled === false ) return;

		window.removeEventListener( 'keydown', keydown );

		_prevState = _state;

		if ( _state !== STATE.NONE ) {

			return;

		} else if ( event.keyCode === _this.keys[ STATE.ROTATE ] && !_this.noRotate ) {

			_state = STATE.ROTATE;

		} else if ( event.keyCode === _this.keys[ STATE.ZOOM ] && !_this.noZoom ) {

			_state = STATE.ZOOM;

		} else if ( event.keyCode === _this.keys[ STATE.PAN ] && !_this.noPan ) {

			_state = STATE.PAN;

		}

	}

	function keyup( event ) {

		if ( _this.enabled === false ) return;

		_state = _prevState;

		window.addEventListener( 'keydown', keydown, false );

	}

	function mousedown( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		if ( _state === STATE.NONE ) {

			_state = event.button;

		}

		// debugging hack for rotation
		if ( _state === STATE.PAN && event.altKey ) {
			_state = STATE.ROTATE;
		}

		if ( _state === STATE.ROTATE && !_this.noRotate ) {

			_rotateStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
			_rotateEnd.copy( _rotateStart );			

		} else if ( _state === STATE.ZOOM && !_this.noZoom ) {

			_zoomStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
			_zoomEnd.copy(_zoomStart);

		} else if ( _state === STATE.PAN && !_this.noPan ) {

			_panStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
			_panEnd.copy(_panStart);

		}

		document.addEventListener( 'mousemove', mousemove, false );
		document.addEventListener( 'mouseup', mouseup, false );

		_this.dispatchEvent( startEvent );

	}

	function mousemove( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		if ( _state === STATE.ROTATE && !_this.noRotate ) {

			_rotateEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

		} else if ( _state === STATE.ZOOM && !_this.noZoom ) {

			_zoomEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

		} else if ( _state === STATE.PAN && !_this.noPan ) {

			_panEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

		}

	}

	function mouseup( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		_state = STATE.NONE;

		document.removeEventListener( 'mousemove', mousemove );
		document.removeEventListener( 'mouseup', mouseup );
		_this.dispatchEvent( endEvent );

	}

	function mousewheel( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		var delta = 0;

		if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

			delta = event.wheelDelta / 40;

		} else if ( event.detail ) { // Firefox

			delta = - event.detail / 3;

		}

		_zoomStart.y += delta * 0.01;
		_this.dispatchEvent( startEvent );
		_this.dispatchEvent( endEvent );

	}

	function touchstart( event ) {

		if ( _this.enabled === false ) return;

		var x, y, dx, dy;

		switch ( event.touches.length ) {

			case 1:
				_state = STATE.TOUCH_PAN;
				x = event.touches[ 0 ].pageX;
				y = event.touches[ 0 ].pageY;
				_panStart.copy( getMouseOnScreen( x, y ) );
				_panEnd.copy( _panStart );
				break;

			case 2:
				_state = STATE.TOUCH_ZOOM;
				dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				_touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );
				break;

			default:
				_state = STATE.NONE;

		}
		_this.dispatchEvent( startEvent );


	}

	function touchmove( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		var x, y, dx, dy;

		switch ( event.touches.length ) {

			case 1:
				x = event.touches[ 0 ].pageX;
				y = event.touches[ 0 ].pageY;
				_panEnd.copy( getMouseOnScreen( x, y ) );
				break;

			case 2:
				dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				_touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy );
				break;

			default:
				_state = STATE.NONE;

		}

	}

	function touchend( event ) {

		if ( _this.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:
				var x = event.touches[ 0 ].pageX;
				var y = event.touches[ 0 ].pageY;
				_panEnd.copy( getMouseOnScreen( x, y ) );
				_panStart.copy( _panEnd );
				break;

			case 2:
				_touchZoomDistanceStart = _touchZoomDistanceEnd = 0;
				break;

		}

		_state = STATE.NONE;
		_this.dispatchEvent( endEvent );

	}

	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

	this.domElement.addEventListener( 'mousedown', mousedown, false );

	this.domElement.addEventListener( 'mousewheel', mousewheel, false );
	this.domElement.addEventListener( 'DOMMouseScroll', mousewheel, false ); // firefox

	this.domElement.addEventListener( 'touchstart', touchstart, false );
	this.domElement.addEventListener( 'touchend', touchend, false );
	this.domElement.addEventListener( 'touchmove', touchmove, false );

	window.addEventListener( 'keydown', keydown, false );
	window.addEventListener( 'keyup', keyup, false );

	this.handleResize();

	// force an update at start
	this.update();

};

THREE.MapControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.MapControls.prototype.constructor = THREE.MapControls;
