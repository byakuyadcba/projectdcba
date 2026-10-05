(() => {
  const BOOTH_HOSTNAME = "p-dcba.booth.pm";
  const BOOTH_UTM = {
    source: "project-dcba.com",
    medium: "referral",
    campaign: "hp_booth",
  };

  const hasGtag = () => typeof window.gtag === "function";

  const addBoothUtm = (link) => {
    if (!link?.dataset?.track) return false;

    const url = new URL(link.href, window.location.href);
    if (url.hostname.toLowerCase() !== BOOTH_HOSTNAME) return false;

    url.searchParams.set("utm_source", BOOTH_UTM.source);
    url.searchParams.set("utm_medium", BOOTH_UTM.medium);
    url.searchParams.set("utm_campaign", BOOTH_UTM.campaign);
    url.searchParams.set("utm_content", link.dataset.track);
    link.href = url.toString();

    return true;
  };

  window.trackEvent = (name, params = {}) => {
    if (!hasGtag()) return;
    window.gtag("event", name, params);
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-track]");
    if (!link) return;

    const isBoothLink = addBoothUtm(link);

    window.trackEvent("outbound_click", {
      event_category: "engagement",
      event_label: link.dataset.track,
      destination: link.href,
    });

    if (!isBoothLink) return;

    window.trackEvent("booth_click", {
      link_id: link.dataset.track,
      link_position: link.dataset.trackPosition || "unspecified",
      source_page_path: window.location.pathname,
      destination_path: link.pathname,
    });
  });

  document.querySelectorAll("a[data-track]").forEach(addBoothUtm);
})();
