const SAVE_BUTTON_ID = 'save-button';

const FORM_ID = 'settings-form';
const FORM = document.getElementById(FORM_ID);

const YAY_RULES_TEXTAREA_NAME = 'yay-rules-input';
const NAY_RULES_TEXTAREA_NAME = 'nay-rules-input';
const MEH_RULES_TEXTAREA_NAME = 'meh-rules-input';

async function updateUi() {
  // Access settings from storage with default values.
  const { yayRules, nayRules, mehRules } = await chrome.storage.local.get({
    yayRules: '',
    nayRules: '',
    mehRules: '',
  });
  console.log(nayRules);

  // Update UI with current values.
  FORM.elements[YAY_RULES_TEXTAREA_NAME].value = yayRules;
  FORM.elements[NAY_RULES_TEXTAREA_NAME].value = nayRules;
  FORM.elements[MEH_RULES_TEXTAREA_NAME].value = mehRules;
}

async function onSave() {
  // Get values from form.
  const yayRules = FORM.elements[YAY_RULES_TEXTAREA_NAME].value;
  const nayRules = FORM.elements[NAY_RULES_TEXTAREA_NAME].value;
  const mehRules = FORM.elements[MEH_RULES_TEXTAREA_NAME].value;

  // Save to storage.
  chrome.storage.local.set({
    yayRules,
    nayRules,
    mehRules,
  });
}

// Update UI immediately, and on any storage changes.
updateUi();
chrome.storage.local.onChanged.addListener(updateUi);

// Register listener for save button click.
document.getElementById(SAVE_BUTTON_ID).addEventListener('click', onSave);
