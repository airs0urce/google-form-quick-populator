
var pasteValues = {};
function getPasteValue(name) {
    return (pasteValues[name] ? pasteValues[name]: '');
}

function cancelAutoSubmitMessage(text) {
    document.body.style.paddingTop = '5rem';

    let div = document.createElement('div');
    div.style="position:fixed; top: 0; left: 0; background: rgb(247 227 202); border-bottom: 1px solid black;font-size: 1.5rem;padding: 0.2rem 0.2rem; width: 100%;"
    div.innerHTML = 'Auto-submit cancel reason: ' + text + '<br/><strong>Review form and submit manually.</strong>';
    document.body.appendChild(div)
}


const inputElementsSelector = 'input[type="text"],input[type="password"],input[type="number"],input[type="url"],input[type="email"]';
chrome.storage.local.get([
    'enableAutoSubmit', 
    'enableAutopopulation', 
    'forInject',
    'autoSubmitOnlyIfAllFieldsFound',
    'autoSubmitOnlyIfNoEmptyFieldLeft',
    'autoSubmitOnlyIfNoCheckboxOrRadio',
], function(result) {    
    if (!result.enableAutopopulation) {
        return;
    }

    if (! result.forInject) {
        return;
    }

    if (document.querySelector('.freebirdFormviewerViewResponseConfirmationMessage')) {
        // form already submitted. THis is "Your response has been recorded." screen
        return;
    }

    pasteValues = result.forInject.pasteValues;

    const pasteRules = [];

    for (let formField of result.forInject.formFields) {
        const regexp = new RegExp(formField.regexp, formField.regexpFlags);
        const pasteValue = getPasteValue(formField.name);
        pasteRules.push({regexp, pasteValue, fieldName: formField.name});
    }

    const formElements = document.querySelectorAll('.freebirdFormviewerComponentsQuestionBaseRoot');

    let pastedFieldsList = [];
    for (let formElement of formElements) {
        const label = formElement.querySelector('.freebirdFormviewerComponentsQuestionBaseTitle').innerText;
        
        const input = formElement.querySelector(inputElementsSelector);
        const textarea = formElement.querySelector('textarea');

        for (let pasteRule of pasteRules) {
            // pasteRule.regexp
            // pasteRule.pasteValue
            if (pasteRule.regexp.test(label)) {
                if (input) {
                    input.value = pasteRule.pasteValue;
                    input.dispatchEvent(new Event('input', { 'bubbles': true }));
                } else if (textarea) {
                    textarea.innerText = pasteRule.pasteValue;
                    textarea.dispatchEvent(new Event('input', { 'bubbles': true }));
                }

                if (!pastedFieldsList.includes(pasteRule.fieldName)) {
                    pastedFieldsList.push(pasteRule.fieldName)
                }
            }
        }
    }

    const finalFormElements = document.querySelectorAll('.freebirdFormviewerComponentsQuestionBaseRoot');
    const populatedForm = {};
    for (let formElement of finalFormElements) {
        const label = formElement.querySelector('.freebirdFormviewerComponentsQuestionBaseTitle').innerText;
        const val1 = formElement.querySelector('input');
        const val2 = formElement.querySelector('textarea');
        if (val1) {
            populatedForm[label] = val1.value
        } else if (val2) {
            populatedForm[label] = val2.value
        }
    }

    if (result.enableAutoSubmit) {
        if (result.autoSubmitOnlyIfAllFieldsFound && pastedFieldsList.length < Object.keys(pasteValues).length) {
            // don't submit because we were able to paste not all fields

            const notFoundFields = [];
            Object.keys(pasteValues).forEach((fieldToPaste) => {
                if (! pastedFieldsList.includes(fieldToPaste)) {
                    notFoundFields.push(fieldToPaste)
                }
            });

            cancelAutoSubmitMessage(`not found where to populate these fields: <span style="color: red;">"${notFoundFields.join('", "')}"</span>`);
            return;
        }

        if (result.autoSubmitOnlyIfNoEmptyFieldLeft) {
            var inputElements = document.querySelectorAll(inputElementsSelector);
            var textareas = document.querySelectorAll('textarea');

            for (let inputElement of inputElements) {

                if (! inputElement.getAttribute('aria-labelledby')) {
                    // ignore, because this is field that google forms adds for "Other" option for checkboxes
                    continue;
                }

                if (inputElement.value === '') {
                    // empty field, cancel auto-submit
                    cancelAutoSubmitMessage('empty field left in form');
                    return;
                }
            }
            for (let textarea of textareas) {
                if (textarea.innerText === '') {
                    // empty field, cancel auto-submit
                    cancelAutoSubmitMessage('empty textarea field left in form');
                    return;
                }
            }
        }

        if (result.autoSubmitOnlyIfNoCheckboxOrRadio) {
            const foundEls = {
                checkboxes: (document.querySelectorAll('.quantumWizTogglePapercheckboxEl').length > 0),
                dropdowns: (document.querySelectorAll('.quantumWizMenuPaperselectOptionList').length > 0),
                radios: (document.querySelectorAll('.appsMaterialWizToggleRadiogroupGroupContainer').length > 0),
            };
            
            if (foundEls.checkboxes || foundEls.dropdowns || foundEls.radios) {
                // detected checkbox/select or radio
                let detectedEls = [];
                detectedEls.push(foundEls.checkboxes ? 'checkbox buttons': '');
                detectedEls.push(foundEls.dropdowns ? 'dropdowns': '');
                detectedEls.push(foundEls.checkboxes ? 'radio buttons': '');
                cancelAutoSubmitMessage(`detected elements: "` + detectedEls.join('", "') + `"`);
                return;
            }
        }
        
        chrome.storage.local.set({lastPopulatedFormData: populatedForm});
        document.querySelector('.freebirdFormviewerViewNavigationButtons .exportButtonContent').click();
    } else {
        chrome.storage.local.set({lastPopulatedFormData: populatedForm});
    }

});




