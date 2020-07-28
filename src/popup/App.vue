<template >
    <div class="root">
        <h1>Google Forms Populator</h1>
        <hr>
        <h2>Form model</h2>
        <div class="body">
            <label>Paste form model code here:</label>
            <div><textarea v-model="formModelJSON"></textarea></div>
            <div v-html="parseStateHtml"></div>
        </div>
        
        <div v-if="formFields.length > 0">
            <h2>Enter field values</h2>
            <div class="body">

                <div class="field-item" v-for="formField in formFields">
                    <div><strong>{{formField.name}}</strong></div>
                    <div><input v-model="fieldValues[formField.name]" type="text" /></div>    
                </div>
            </div>    
            <div class="note">
                Fields will be auto-populated after you open Google Form.
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
            loadedFieldValues: {formModelId: null, fieldValues: {}}
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
                        regexp: new RegExp(field.regexp, field.regexpFlags)
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
                fieldValues: this.fieldValues
            });
        }
        
    }
}
</script>

<style lang="scss" scoped>
.root {
    width: 600px;
    color: #444;
    font-family: Courier;
    padding-bottom: 0.5em;
    font-size: 14px;
}

textarea {
    width: 570px;
    min-width: 570px;
    max-width: 570px;
    height: 6rem;
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

</style>
