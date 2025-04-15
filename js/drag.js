function setDraggable(id) {
	const draggable = document.getElementById(id);
	if (!draggable) return;

	let isDragging = false;

	function startDrag(e, isTouchEvent) {
		const target = e.target;
		if (target !== draggable && target.closest('[data-clickable]')) {
			return;
		}
		if (isTouchEvent) e.preventDefault();

		draggable.style.pointerEvents = 'none';

		const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
		const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;

		const rect = draggable.getBoundingClientRect();
		const shiftX = clientX - rect.left;
		const shiftY = clientY - rect.top;

		function moveAt(pageX, pageY) {
			draggable.style.left = `${pageX - shiftX}px`;
			draggable.style.top = `${pageY - shiftY}px`;
		}

		function handleMove(e) {
			if (!isDragging) isDragging = true;
			
			if (isTouchEvent) {
				const touch = e.touches[0];
				moveAt(touch.pageX, touch.pageY);
				e.preventDefault();
			} else {
				moveAt(e.pageX, e.pageY);
			}
		}

		function handleEnd() {
			draggable.style.pointerEvents = 'auto';
			
			if (isTouchEvent) {
				document.removeEventListener('touchmove', handleMove);
				document.removeEventListener('touchend', handleEnd);
			} else {
				document.removeEventListener('mousemove', handleMove);
				document.removeEventListener('mouseup', handleEnd);
			}

			if (!isDragging) {
				const clickEvent = new Event('click');
				target.dispatchEvent(clickEvent);
			}
			isDragging = false;
		}

		if (isTouchEvent) {
			document.addEventListener('touchmove', handleMove, { passive: false });
			document.addEventListener('touchend', handleEnd, { passive: false });
		} else {
			document.addEventListener('mousemove', handleMove);
			document.addEventListener('mouseup', handleEnd);
		}
	}

	draggable.addEventListener('mousedown', (e) => startDrag(e, false));
	draggable.addEventListener('touchstart', (e) => startDrag(e, true));
	draggable.ondragstart = () => false;
}