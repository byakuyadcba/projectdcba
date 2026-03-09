(() => {
  const hasGtag = () => typeof window.gtag === "function";

  window.trackEvent = (name, params = {}) => {
    if (!hasGtag()) return;
    window.gtag("event", name, params);
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-track]");
    if (!link) return;
    window.trackEvent("outbound_click", {
      event_category: "engagement",
      event_label: link.dataset.track,
      destination: link.href,
    });
  });
})();
