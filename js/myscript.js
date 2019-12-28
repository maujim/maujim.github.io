function toggleSideNav() {
	// toggles the side nav
	var sideNavElem = document.getElementById('sideNav');
	sideNavElem.classList.toggle('side-nav-active');

	// toggles the overlay
	var overlayElem = document.getElementById('overlay');
	overlayElem.classList.toggle('side-nav-active');

	// hides the logo in navbar, allowing for a better looking transition
	var navbarLogoElem = document.getElementById('navbar-logo');
	navbarLogoElem.classList.toggle('invisible'); // invisible is a built-in bootstrap class

	// while the side nav is open, changes the look of the button that toggles the side nav
	var navbarTogglerElem = document.querySelector('.navbar-toggler');
	navbarTogglerElem.classList.toggle('side-nav-active');
	var navbarTogglerIconElem = document.querySelector('.navbar-toggler-icon');
	navbarTogglerIconElem.classList.toggle('side-nav-active');

	// hides the border below the navbar
	var navbarBorderChangeElem = document.querySelector('.navbar-expand-lg');
	navbarBorderChangeElem.classList.toggle('side-nav-active');
	
	// toggles the event listener to exit the sidenav if user clicks outside of it
	overlayElem.addEventListener('click', function() {
		toggleSideNav();
	});
}
