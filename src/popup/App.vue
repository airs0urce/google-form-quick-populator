<template >
    <div class="root">
        <h2>Form model</h2>
        <div class="body">
            <label>Paste form model code here:</label>
            <div><textarea v-model="formModelJSON"></textarea></div>
            <div v-html="parseStateHtml"></div>
        </div>
        
        <h2>Field values</h2>
        <div class="body">

            <div class="field-item" v-for="formField in formFields">
                <div><strong>{{formField.name}}</strong></div>
                <div><input type="text" /></div>    
            </div>

        </div>
    </div>
</template>

<script>
const formModelJSON = `{"fields": [{"name":"ETH Address","regexp":"(eth|ethereum)","regexpFlags": "i"},{"name":"Email","regexp":"(email|mail)","regexpFlags": "i"}]}`;

export default {
    data: function () {
        return {
            formModelJSON: formModelJSON,
            parseStateHtml: ''
        }
    },
    computed: {
        formFields: function() {
            const formFields = [];
            let formModel;

            try {
                formModel = JSON.parse(this.formModelJSON);
            } catch (e) {
                this.parseStateHtml = 'parsing: <span style="color:red;">' + e.message + '</span>';
                return [];
            }
            this.parseStateHtml = 'parsing: <span style="color:green;">valid</span>';

            
            for (let field of formModel.fields) {
                const formField = field;

                formFields.push(formField);
            }
            return formFields;
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

</style>
