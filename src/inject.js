
var fieldValues = {};
function getFieldValue(name) {
    return (fieldValues[name] ? fieldValues[name]: '');
}

chrome.storage.local.get(['forInject'], function(result) {    
    fieldValues = result.forInject.fieldValues;

    const pasteRules = [];

    for (let formField of result.forInject.formFields) {
        const regexp = new RegExp(formField.regexp, formField.regexpFlags);
        const pasteValue = getFieldValue(formField.name);
        pasteRules.push({regexp, pasteValue});
    }

    const formElements = document.querySelectorAll('.freebirdFormviewerComponentsQuestionBaseRoot');

    for (let formElement of formElements) {
        const label = formElement.querySelector('.freebirdFormviewerComponentsQuestionBaseTitle').innerText;
        
        const input = formElement.querySelector('input[type=text]');
        const textarea = formElement.querySelector('textarea');

        for (let pasteRule of pasteRules) {
            // pasteRule.regexp
            // pasteRule.pasteValue
            if (pasteRule.regexp.test(label)) {

                if (input) {
                    input.value = pasteRule.pasteValue;
                    input.dispatchEvent(new Event('input', { 'bubbles': true }));     
                }
                if (textarea) {
                    textarea.innerText = pasteRule.pasteValue;
                    textarea.dispatchEvent(new Event('input', { 'bubbles': true }));
                }
                
            }
        }
    }

});




