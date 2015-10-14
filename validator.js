/*!
 * validator.js v1.2.1
 * http://www.noindoin.com/
 *
 * Copyright 2015 Jiang Fengming <fenix@noindoin.com>
 * Released under the MIT license
 */

var validator = {
  $: function(el) {
    if (el && el.constructor == String)
      el = document.querySelector(el);
    return el;
  },

  setInput: function(input, opts) {
    input = validator.$(input);
    if (!input || input.type in { button: 1, submit: 1, reset: 1, image: 1 } || input.nodeName == 'BUTTON')
      return;

    if (!opts)
      opts = {};
    else if (opts.constructor == Function)
      opts = { leave: opts };
    input.validator = opts;

    if (input.type in { checkbox: 1, radio: 1 }) {
      input.addEventListener('change', function() {
        validator.checkInput(this, 'leave');
      });
    } else {
      input.addEventListener('keyup', function() {
        // if control key is pressed and document has lost focus,
        // blur event will be fired, then don't need to check at here.
        if (document.hasFocus())
          validator.checkInput(this, 'typing');
      });

      input.addEventListener('paste', function() {
        var self = this;
        // paste event fires before value change
        setTimeout(function() {
          validator.checkInput(self, 'typing');
        });
      });

      input.addEventListener('drop', function() {
        var self = this;
        // drop event fires before value change
        setTimeout(function() {
          validator.checkInput(self, 'leave');
        });
      });

      input.addEventListener('change', function() {
        validator.checkInput(this, 'leave');
      });

      input.addEventListener('blur', function() {
        validator.checkInput(this, 'leave');
      });
    }

    validator.checkInput(input);
  },

  set: function(form, opts) {
    form = validator.$(form);
    if (!form)
      return;

    form.validator = opts || {};
    if (!form.validator.inputs)
      form.validator.inputs = {};

    var inputs = form.elements;
    for (var i = inputs.length - 1; i >= 0; i--)
      validator.setInput(inputs[i], form.validator.inputs[inputs[i].name]);
  },

  checkInput: function(input, state) {
    input = validator.$(input);
    if (!input || input.type in { button: 1, submit: 1, reset: 1, image: 1 } || input.nodeName == 'BUTTON')
      return;

    var val = input.value || input.innerHTML;
    var vd = input.validator;

    if (state in { typing: 1, leave: 1 }) {
      vd.interacted = true;
      if (input.form && input.form.validator)
        input.form.validator.interacted = true;
    }

    var results = ['typing', 'leave'].map(function(state) {
      return vd[state] ? (vd[state].constructor == RegExp ? vd[state].test(val) : vd[state].call(input, val)) : true;
    });

    var valid = (results[1] == true) && (results[0] == true);

    if (valid) {
      var message = '';
    } else {
      if (state == 'typing' && results[0].constructor == String)
        message = results[0];
      else
        message = results[1].constructor == String ? results[1] : (results[0].constructor == String ? results[0] : 'error');
    }

    input.setCustomValidity(message);

    valid = input.validity.valid;

    if (vd.interacted) {
      // user is typing and current has no problem, but hasn't been totally fulfilled
      // it's neither valid nor invalid
      if (state == 'typing' && results[0] == true && !valid) {
        validator.removeClass(input, 'valid invalid');
      } else {
        validator.removeClass(input, valid ? 'invalid' : 'valid');
        validator.addClass(input, valid ? 'valid' : 'invalid');
      }
    }

    validator.updateFormValidity(input.form);

    return valid;
  },

  setError: function(form) {
    if (!(form = validator.$(form)) || !form.validator)
      return;

    var vd = form.validator;
    var validBefore = vd.valid;
    vd.valid = false;
    validator.removeClass(form, 'valid');
    validator.addClass(form, 'invalid');
    if (vd.validityChange && validBefore != vd.valid)
      vd.validityChange.call(form, vd.valid);
  },

  setInputError: function(input, message) {
    input = validator.$(input);
    if (!input)
      return;

    input.validator.interacted = true;
    if (input.form && input.form.validator)
      input.form.validator.interacted = true;
    input.setCustomValidity(message || 'error');
    validator.removeClass(input, 'valid');
    validator.addClass(input, 'invalid');
    validator.updateFormValidity(input.form);
  },

  updateFormValidity: function(form) {
    if (!(form = validator.$(form)) || !form.validator)
      return;

    var vd = form.validator;
    var validBefore = vd.valid;
    vd.valid = form.checkValidity();

    if (vd.interacted) {
      validator.removeClass(form, vd.valid ? 'invalid' : 'valid');
      validator.addClass(form, vd.valid ? 'valid' : 'invalid');
    }

    if (vd.validityChange && validBefore != vd.valid)
      vd.validityChange.call(form, vd.valid);

    return vd.valid;
  },

  check: function(form) {
    if (!(form = validator.$(form)))
      return;

    var inputs = form.elements;
    for (var i = inputs.length - 1; i >= 0; i--)
      validator.checkInput(inputs[i]);

    return form.checkValidity();
  },

  addClass: function(el, cls) {
    var current = el.className.split(' ');
    cls.split(' ').forEach(function(v) {
      if (current.indexOf(v) == -1)
        current.push(v);
    });
    el.className = current.filter(function(v) {
      return v;
    }).join(' ');
  },

  removeClass: function(el, cls) {
    cls = cls.split(' ');
    el.className = el.className.split(' ').filter(function(v) {
      return v && cls.indexOf(v) == -1;
    }).join(' ');
  }
};

// CommonJS
if (typeof module != 'undefined' && module.exports)
  module.exports = validator;
