/* global localStorage, document */
(function () {
  try {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch {
    // Ignore read/write errors (e.g. storage disabled)
  }
})();
