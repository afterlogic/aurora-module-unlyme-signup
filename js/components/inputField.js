ko.components.register('like-widget', {
    viewModel: function(params) {
        // Data: value is either null, 'like', or 'dislike'
        this.label = params.labelI18n
        this.placeholder = params.placeholderI18n
        this.error = params.errorI18n
        this.chosenValue = params.value
        this.isError = params.isError
         
        // Behaviors
        this.like = function() { this.chosenValue('like'); }.bind(this)
        this.dislike = function() { this.chosenValue('dislike'); }.bind(this)
    },
    template:
`<div class="row domain">
<label class="label" data-bind="i18n: {'key': label}"></label>
<div class="value">
    <input tabindex="1" class="input domain" password type="text" spellcheck="false"
            data-bind="value: domain, hasfocus: domainFocus, valueUpdate: 'afterkeydown',
            i18n: {'key': '%MODULENAME%/PLACEHOLDER_DOMAIN', 'type': 'placeholder'}" />
    <div class="error" data-bind="visible: isError, i18n: {'key': errorI18n}"></div>
</div>
</div>`
});