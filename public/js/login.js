const form = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const submitButton = document.getElementById('submit-btn');
const errorMessage = document.getElementById('error');

function getNextUrl() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next');

  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  errorMessage.textContent = '';
  submitButton.disabled = true;
  submitButton.textContent = '验证中...';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput.value })
    });

    if (!response.ok) {
      throw new Error('密码错误');
    }

    window.location.assign(getNextUrl());
  } catch (err) {
    errorMessage.textContent = err.message || '验证失败，请重试';
    passwordInput.select();
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = '进入测速';
  }
});
