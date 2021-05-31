function sendStartMsg() {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { message: 'start' });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  document
    .getElementById('startButton')
    .addEventListener('click', sendStartMsg);
  document
    .getElementById('cowboy-youtube-pair')
    .addEventListener('click', () =>
      window.open('https://www.youtube.com/codecowboy?sub_confirmation=1')
    );
  document
    .getElementById('help-button')
    .addEventListener('click', () =>
      alert(
        'Open a game of Word Blitz on Facebook, then when the letters appear, press the "Inject Hack" button. For more help visit YouTube.com/CodeCowboy'
      )
    );

  chrome.runtime.onMessage.addListener(function (request) {
    alert(request.message);
  });
});
