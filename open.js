(async () => {
  const res = await fetch("https://get-ip-nero.herokuapp.com/auth");
  const url = await res.json();
  location.href = url.url;
})();