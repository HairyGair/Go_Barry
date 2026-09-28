// Enquiry form: posts to the same endpoint as the app's "I'm interested" form,
// so enquiries arrive by email and in Settings > Admin > Enquiries.
(function () {
  var form = document.getElementById('enquiry');
  if (!form) return;
  var status = form.querySelector('.form-status');
  var button = form.querySelector('button[type="submit"]');
  var API = 'https://api.breakdowns.gobarry.co.uk/api/public/interest';

  function show(text, ok) {
    status.textContent = text;
    status.className = 'form-status ' + (ok ? 'ok' : 'err');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });
    if (!data.name || !data.company || !data.email) {
      show('Please add your name, company and work email.', false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      show('Please check your email address.', false);
      return;
    }
    data.features = 'Website enquiry (gobarry.co.uk)';
    button.disabled = true;
    button.textContent = 'Sending…';
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && res.j.success !== false) {
          form.reset();
          show('Thank you. We’ve got your enquiry and will be in touch shortly.', true);
          button.textContent = 'Sent';
        } else {
          show((res.j && res.j.error) || 'Sorry, that didn’t send. Please email gair@gairware.com instead.', false);
          button.disabled = false;
          button.textContent = 'Send enquiry';
        }
      })
      .catch(function () {
        show('Sorry, that didn’t send. Please email gair@gairware.com instead.', false);
        button.disabled = false;
        button.textContent = 'Send enquiry';
      });
  });
})();
