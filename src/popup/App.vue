<template >
    <div class="root">
        <h1>Google Forms Quick Populator</h1>
        <hr>
        <h2>Form model JSON 
            <a href="#json-model-help" @click="showExplanation = !showExplanation"><span v-if="showExplanation">(ok)</span><span v-if="!showExplanation">(what?)</span></a>
        </h2>
        <div v-if="showExplanation">
            <div>Form Model JSON defines regular expressions which matches titles for fields in Google Forms.</div>
            
            <div>Example Google Form: 
                <a href="#" @click="openLink('https://forms.gle/Jd78vkCsfPtAmE7c7')">https://forms.gle/Jd78vkCsfPtAmE7c7</a>
            </div>
            <div>Example From Model JSON: </div>
            <pre>
{
    "id":"EQUUS",
    "fields": [
        {
            "regexp":"(\\beth\\b|\\bethereum\\b)",
            "regexpFlags": "i",
            "name":"ETH Address",
        },
        {
            "regexp":"e?mail",
            "regexpFlags": "i",
            "name":"Email",
        },
        {
            "regexp":"(allocation|amount)",
            "regexpFlags": "i",
            "name":"Allocation",
        },
        {
            "regexp":"(discord)",
            "regexpFlags": "i",
            "name":"Discord name",
        }
    ]
}
<br>
<strong>Description:</strong>
<strong>id</strong> - Id of Form Model. Any string.
<strong>fields.regexp</strong> - Regular expression. Used to construct "new RegExp([regexp], [regexpFlags])"
<strong>fields.regexpFlags</strong> - Regular expression flags. Used to construct "new RegExp([regexp], [regexpFlags])"
<strong>fields.name</strong> - Name for matched field. Used to populate Paste Values in this extension.

Good service for testing regular expressions: <a href="#" @click="openLink('https://regexr.com/')">https://regexr.com/</a>

<strong>This is how we run match check using config above:</strong>
<code>
const regexp = new RegExp([regexp], [regexpFlags]);
if (regexp.test([field title parsed from Google Form])) {
    alert('Match found')
} else {
    alert('Match not found')
}
</code>

            </pre>
        </div>
        <div v-if="!showExplanation">
            <div class="body">
                <label>Paste Form Model JSON here:</label>
                <div><textarea v-model="formModelJSON"></textarea></div>
                <div v-html="parseStateHtml"></div>
            </div>
            
            <div v-if="formFields.length > 0">
                <h2>Enter Paste Values</h2>
                <div class="body">

                    <div class="field-item" v-for="formField in formFields">
                        <div><strong>{{formField.name}}</strong></div>
                        <div><input v-model="fieldValues[formField.name]" type="text" /></div>    
                    </div>
                </div>    
                <div class="note">
                    Fields will be auto-populated after you open Google Form.
                </div>
                <div class="note">
                    (Right now we populate only input and textarea fields. WARNING: It doesn't send form automatically)
                </div>

                <div class="test-interface-btn-wrapper">
                    <button class="test-interface-btn" v-if="!enableTest" @click="enableTest = true">Show test interface</button>
                    <button class="test-interface-btn" v-if="enableTest" @click="enableTest = false">Hide test interface</button>    
                </div>
                

                <div v-if="enableTest">
                    <h2>Test label match</h2>
                    <div class="body">
                        <div>
                            Here you can select field and write text that you think will be in Google Form near field which you need to populate.
                        </div>
                        <div>
                            <div>Field definition from form model:</div>
                            <select v-model="testField">
                                <option v-for="formField in formFields" :value="formField">{{formField.name}}</option>
                            </select>
                        </div>
                        <div>
                            <div>Field label in Google Forms:</div>
                            <input type="input" v-model="testValue">    
                        </div>
                        <br>
                        <div v-html="getTestResultHtml()">
                        </div>
                        
                    </div>   
                    <br>
                    <br>     
                    <br>
                </div>
                
                
            </div>
        </div>
        
    </div>
</template>

<script>
import chromep from 'chrome-promise';



export default {
    data: function () {
        return {
            formModelJSON: '',
            parseStateHtml: '',
            formModelId: '',
            fieldValues: {},
            loadedFieldValues: {formModelId: null, fieldValues: {}},

            testField: {},
            testValue: '',

            enableTest: false,

            showExplanation: false
        }
    },
    watch: {
        fieldValues: {
            handler(val) {
                this.saveFormAndFieldValues();
            },
            deep: true
        },
    },
    computed: {
        formFields: function() {
            const formFields = [];
            let formModel;

            if ('' == this.formModelJSON) {
                this.parseStateHtml = '';
                return [];
            }
            

            try {
                formModel = JSON.parse(this.formModelJSON);
            } catch (e) {
                this.parseStateHtml = 'validation: <span style="color:red;">' + e.message + '</span>';
                return [];
            }

            if (typeof formModel.id == 'undefined') {
                this.parseStateHtml = 'validation: <span style="color:red;">No "id" field in form model</span>';
                return [];
            }

            this.formModelId = formModel.id;

            if (this.formModelId == this.loadedFieldValues.formModelId) {
                this.fieldValues = {...this.loadedFieldValues.fieldValues}
            } else {
                this.fieldValues = {};
            }

            if (typeof formModel.fields == 'undefined') {
                this.parseStateHtml = 'validation: <span style="color:red;">No "fields" array in form model</span>';
                return [];
            }
            for (let field of formModel.fields) {
                if (typeof field.name != 'string' ) {
                    this.parseStateHtml = 'validation: <span style="color:red;">Incorrect "name" field format for element in "fields" array: ' + JSON.stringify(field) + '</span>';
                    return [];
                }
                if (typeof field.regexp != 'string' ) {
                    this.parseStateHtml = 'validation: <span style="color:red;">Incorrect "regexp" field format for element in "fields" array: ' + JSON.stringify(field) + '</span>';
                    return [];
                }
                if (typeof field.regexpFlags != 'string' ) {
                    this.parseStateHtml = 'validation: <span style="color:red;">Incorrect "regexpFlags" field format for element in "fields" array: ' + JSON.stringify(field) + '</span>';
                    return [];
                }

            }
            

            try {
                for (let field of formModel.fields) {
                    const formField = {
                        name: field.name,
                        regexp: field.regexp,
                        regexpFlags: field.regexpFlags,
                    };
                    formFields.push(formField);
                }
            } catch (e) {
                this.parseStateHtml = 'validation: <span style="color:red;">' + e.message + '</span>';
                return [];
            }

            this.parseStateHtml = 'validation: <span style="color:green;">valid</span>';

            return formFields;
        }
    },
    async mounted() {
        const result = await chromep.storage.local.get(['formModelJSON', 'formModelId', 'fieldValues']);
        if (result.fieldValues) {
            this.formModelJSON = result.formModelJSON;
            this.loadedFieldValues.formModelId = result.formModelId;
            this.loadedFieldValues.fieldValues = result.fieldValues;
        }
    },
    methods: {
        saveFormAndFieldValues: async function() {
            await chromep.storage.local.set({
                formModelJSON: this.formModelJSON,
                formModelId: this.formModelId, 
                fieldValues: this.fieldValues,

                forInject: {formFields: this.formFields, fieldValues: this.fieldValues}
            });
        },
        getTestResultHtml() {
            
            if (! this.testField.regexp) {
                return `<strong>Result</strong>: <span>select options above</span>`;
            }
            const regexp = new RegExp(this.testField.regexp, this.testField.regexpFlags);
            if (regexp.test(this.testValue)) {
                return `<strong>Result</strong>: <span style="color: green">matches</span>`;
            } else {
                return `<strong>Result</strong>: <span style="color: red">doesn't match</span>`;
            }
            
        },
        openLink(url) {
            chrome.tabs.create({url: url});
        }
        
    }
}
</script>

<style lang="scss" scoped>
.root {
    width: 700px;
    color: #444;
    font-family: Courier;
    padding-bottom: 0.5em;
    font-size: 11px;
}

textarea {
    width: 670px;
    min-width: 670px;
    max-width: 670px;
    height: 5rem;
}

table {
    width: 100%;
}
table th {
    text-align: left;
}
table td input {
    width: 100%;
}
h2 {
    background-color: #ddd;
    margin: 0.5em 0;
    padding-left: 0.2em;
}
div.body {
    padding: 0.5em 1em;
}    
div.body input {
    width: 100%;
}
.field-item {
    margin-bottom: 0.7em;
}
.note {
    color: #999;
    text-align: center;
}
.test-interface-btn {

    margin-bottom: 1rem;
}
.test-interface-btn-wrapper {
    padding-top: 1rem;
    text-align: right;
}
</style>
