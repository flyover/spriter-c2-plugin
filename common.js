// Scripts in this file are included in both the IDE and runtime, so you only
// need to write scripts common to both once.

CLOSURE_NO_DEPS = true;

// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Bootstrap for the Google JS Library (Closure).
 *
 * In uncompiled mode base.js will write out Closure's deps file, unless the
 * global <code>CLOSURE_NO_DEPS</code> is set to true.  This allows projects to
 * include their own deps file(s) from different locations.
 *
 * @author arv@google.com (Erik Arvidsson)
 *
 * @provideGoog
 */


/**
 * @define {boolean} Overridden to true by the compiler when --closure_pass
 *     or --mark_as_compiled is specified.
 */
var COMPILED = false;


/**
 * Base namespace for the Closure library.  Checks to see goog is already
 * defined in the current scope before assigning to prevent clobbering if
 * base.js is loaded more than once.
 *
 * @const
 */
var goog = goog || {};


/**
 * Reference to the global context.  In most cases this will be 'window'.
 */
goog.global = this;


/**
 * A hook for overriding the define values in uncompiled mode.
 *
 * In uncompiled mode, {@code CLOSURE_UNCOMPILED_DEFINES} may be defined before
 * loading base.js.  If a key is defined in {@code CLOSURE_UNCOMPILED_DEFINES},
 * {@code goog.define} will use the value instead of the default value.  This
 * allows flags to be overwritten without compilation (this is normally
 * accomplished with the compiler's "define" flag).
 *
 * Example:
 * <pre>
 *   var CLOSURE_UNCOMPILED_DEFINES = {'goog.DEBUG': false};
 * </pre>
 *
 * @type {Object<string, (string|number|boolean)>|undefined}
 */
goog.global.CLOSURE_UNCOMPILED_DEFINES;


/**
 * A hook for overriding the define values in uncompiled or compiled mode,
 * like CLOSURE_UNCOMPILED_DEFINES but effective in compiled code.  In
 * uncompiled code CLOSURE_UNCOMPILED_DEFINES takes precedence.
 *
 * Also unlike CLOSURE_UNCOMPILED_DEFINES the values must be number, boolean or
 * string literals or the compiler will emit an error.
 *
 * While any @define value may be set, only those set with goog.define will be
 * effective for uncompiled code.
 *
 * Example:
 * <pre>
 *   var CLOSURE_DEFINES = {'goog.DEBUG': false} ;
 * </pre>
 *
 * @type {Object<string, (string|number|boolean)>|undefined}
 */
goog.global.CLOSURE_DEFINES;


/**
 * Returns true if the specified value is not undefined.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.
 *
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
goog.isDef = function(val) {
  // void 0 always evaluates to undefined and hence we do not need to depend on
  // the definition of the global variable named 'undefined'.
  return val !== void 0;
};


/**
 * Builds an object structure for the provided namespace path, ensuring that
 * names that already exist are not overwritten. For example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * Used by goog.provide and goog.exportSymbol.
 * @param {string} name name of the object that this file defines.
 * @param {*=} opt_object the object to expose at the end of the path.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 * @private
 */
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || goog.global;

  // Internet Explorer exhibits strange behavior when throwing errors from
  // methods externed in this manner.  See the testExportSymbolExceptions in
  // base_test.html for an example.
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // Certain browsers cannot parse code in the form for((a in b); c;);
  // This pattern is produced by the JSCompiler when it collapses the
  // statement above into the conditional loop below. To prevent this from
  // happening, use a for-loop and reserve the init logic as below.

  // Parentheses added to eliminate strict JS warning in Firefox.
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      // last part and we have an object; use it
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * Defines a named value. In uncompiled mode, the value is retrieved from
 * CLOSURE_DEFINES or CLOSURE_UNCOMPILED_DEFINES if the object is defined and
 * has the property specified, and otherwise used the defined defaultValue.
 * When compiled the default can be overridden using the compiler
 * options or the value set in the CLOSURE_DEFINES object.
 *
 * @param {string} name The distinguished name to provide.
 * @param {string|number|boolean} defaultValue
 */
goog.define = function(name, defaultValue) {
  var value = defaultValue;
  if (!COMPILED) {
    if (goog.global.CLOSURE_UNCOMPILED_DEFINES &&
        Object.prototype.hasOwnProperty.call(
            goog.global.CLOSURE_UNCOMPILED_DEFINES, name)) {
      value = goog.global.CLOSURE_UNCOMPILED_DEFINES[name];
    } else if (goog.global.CLOSURE_DEFINES &&
        Object.prototype.hasOwnProperty.call(
            goog.global.CLOSURE_DEFINES, name)) {
      value = goog.global.CLOSURE_DEFINES[name];
    }
  }
  goog.exportPath_(name, value);
};


/**
 * @define {boolean} DEBUG is provided as a convenience so that debugging code
 * that should not be included in a production js_binary can be easily stripped
 * by specifying --define goog.DEBUG=false to the JSCompiler. For example, most
 * toString() methods should be declared inside an "if (goog.DEBUG)" conditional
 * because they are generally used for debugging purposes and it is difficult
 * for the JSCompiler to statically determine whether they are used.
 */
goog.define('goog.DEBUG', true);


/**
 * @define {string} LOCALE defines the locale being used for compilation. It is
 * used to select locale specific data to be compiled in js binary. BUILD rule
 * can specify this value by "--define goog.LOCALE=<locale_name>" as JSCompiler
 * option.
 *
 * Take into account that the locale code format is important. You should use
 * the canonical Unicode format with hyphen as a delimiter. Language must be
 * lowercase, Language Script - Capitalized, Region - UPPERCASE.
 * There are few examples: pt-BR, en, en-US, sr-Latin-BO, zh-Hans-CN.
 *
 * See more info about locale codes here:
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
 *
 * For language codes you should use values defined by ISO 693-1. See it here
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm. There is only one exception from
 * this rule: the Hebrew language. For legacy reasons the old code (iw) should
 * be used instead of the new code (he), see http://wiki/Main/IIISynonyms.
 */
goog.define('goog.LOCALE', 'en');  // default to en


/**
 * @define {boolean} Whether this code is running on trusted sites.
 *
 * On untrusted sites, several native functions can be defined or overridden by
 * external libraries like Prototype, Datejs, and JQuery and setting this flag
 * to false forces closure to use its own implementations when possible.
 *
 * If your JavaScript can be loaded by a third party site and you are wary about
 * relying on non-standard implementations, specify
 * "--define goog.TRUSTED_SITE=false" to the JSCompiler.
 */
goog.define('goog.TRUSTED_SITE', true);


/**
 * @define {boolean} Whether a project is expected to be running in strict mode.
 *
 * This define can be used to trigger alternate implementations compatible with
 * running in EcmaScript Strict mode or warn about unavailable functionality.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode
 *
 */
goog.define('goog.STRICT_MODE_COMPATIBLE', false);


/**
 * @define {boolean} Whether code that calls {@link goog.setTestOnly} should
 *     be disallowed in the compilation unit.
 */
goog.define('goog.DISALLOW_TEST_ONLY_CODE', COMPILED && !goog.DEBUG);


/**
 * @define {boolean} Whether to use a Chrome app CSP-compliant method for
 *     loading scripts via goog.require. @see appendScriptSrcNode_.
 */
goog.define('goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING', false);


/**
 * Defines a namespace in Closure.
 *
 * A namespace may only be defined once in a codebase. It may be defined using
 * goog.provide() or goog.module().
 *
 * The presence of one or more goog.provide() calls in a file indicates
 * that the file defines the given objects/namespaces.
 * Provided symbols must not be null or undefined.
 *
 * In addition, goog.provide() creates the object stubs for a namespace
 * (for example, goog.provide("goog.foo.bar") will create the object
 * goog.foo.bar if it does not already exist).
 *
 * Build tools also scan for provide/require/module statements
 * to discern dependencies, build dependency files (see deps.js), etc.
 *
 * @see goog.require
 * @see goog.module
 * @param {string} name Namespace provided by this file in the form
 *     "goog.package.part".
 */
goog.provide = function(name) {
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice.
    // A goog.module/goog.provide maps a goog.require to a specific file
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
  }

  goog.constructNamespace_(name);
};


/**
 * @param {string} name Namespace provided by this file in the form
 *     "goog.package.part".
 * @param {Object=} opt_obj The object to embed in the namespace.
 * @private
 */
goog.constructNamespace_ = function(name, opt_obj) {
  if (!COMPILED) {
    delete goog.implicitNamespaces_[name];

    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
      if (goog.getObjectByName(namespace)) {
        break;
      }
      goog.implicitNamespaces_[namespace] = true;
    }
  }

  goog.exportPath_(name, opt_obj);
};


/**
 * Module identifier validation regexp.
 * Note: This is a conservative check, it is very possible to be more lenient,
 *   the primary exclusion here is "/" and "\" and a leading ".", these
 *   restrictions are intended to leave the door open for using goog.require
 *   with relative file paths rather than module identifiers.
 * @private
 */
goog.VALID_MODULE_RE_ = /^[a-zA-Z_$][a-zA-Z0-9._$]*$/;


/**
 * Defines a module in Closure.
 *
 * Marks that this file must be loaded as a module and claims the namespace.
 *
 * A namespace may only be defined once in a codebase. It may be defined using
 * goog.provide() or goog.module().
 *
 * goog.module() has three requirements:
 * - goog.module may not be used in the same file as goog.provide.
 * - goog.module must be the first statement in the file.
 * - only one goog.module is allowed per file.
 *
 * When a goog.module annotated file is loaded, it is enclosed in
 * a strict function closure. This means that:
 * - any variables declared in a goog.module file are private to the file
 * (not global), though the compiler is expected to inline the module.
 * - The code must obey all the rules of "strict" JavaScript.
 * - the file will be marked as "use strict"
 *
 * NOTE: unlike goog.provide, goog.module does not declare any symbols by
 * itself. If declared symbols are desired, use
 * goog.module.declareLegacyNamespace().
 *
 *
 * See the public goog.module proposal: http://goo.gl/Va1hin
 *
 * @param {string} name Namespace provided by this file in the form
 *     "goog.package.part", is expected but not required.
 */
goog.module = function(name) {
  if (!goog.isString(name) ||
      !name ||
      name.search(goog.VALID_MODULE_RE_) == -1) {
    throw Error('Invalid module identifier');
  }
  if (!goog.isInModuleLoader_()) {
    throw Error('Module ' + name + ' has been loaded incorrectly.');
  }
  if (goog.moduleLoaderState_.moduleName) {
    throw Error('goog.module may only be called once per module.');
  }

  // Store the module name for the loader.
  goog.moduleLoaderState_.moduleName = name;
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice.
    // A goog.module/goog.provide maps a goog.require to a specific file
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
  }
};


/**
 * @param {string} name The module identifier.
 * @return {?} The module exports for an already loaded module or null.
 *
 * Note: This is not an alternative to goog.require, it does not
 * indicate a hard dependency, instead it is used to indicate
 * an optional dependency or to access the exports of a module
 * that has already been loaded.
 * @suppress {missingProvide}
 */
goog.module.get = function(name) {
  return goog.module.getInternal_(name);
};


/**
 * @param {string} name The module identifier.
 * @return {?} The module exports for an already loaded module or null.
 * @private
 */
goog.module.getInternal_ = function(name) {
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      // goog.require only return a value with-in goog.module files.
      return name in goog.loadedModules_ ?
          goog.loadedModules_[name] :
          goog.getObjectByName(name);
    } else {
      return null;
    }
  }
};


/**
 * @private {?{moduleName: (string|undefined)}}
 */
goog.moduleLoaderState_ = null;


/**
 * @private
 * @return {boolean} Whether a goog.module is currently being initialized.
 */
goog.isInModuleLoader_ = function() {
  return goog.moduleLoaderState_ != null;
};


/**
 * Provide the module's exports as a globally accessible object under the
 * module's declared name.  This is intended to ease migration to goog.module
 * for files that have existing usages.
 * @suppress {missingProvide}
 */
goog.module.declareLegacyNamespace = function() {
  if (!COMPILED && !goog.isInModuleLoader_()) {
    throw new Error('goog.module.declareLegacyNamespace must be called from ' +
        'within a goog.module');
  }
  if (!COMPILED && !goog.moduleLoaderState_.moduleName) {
    throw Error('goog.module must be called prior to ' +
        'goog.module.declareLegacyNamespace.');
  }
  goog.moduleLoaderState_.declareLegacyNamespace = true;
};


/**
 * Marks that the current file should only be used for testing, and never for
 * live code in production.
 *
 * In the case of unit tests, the message may optionally be an exact namespace
 * for the test (e.g. 'goog.stringTest'). The linter will then ignore the extra
 * provide (if not explicitly defined in the code).
 *
 * @param {string=} opt_message Optional message to add to the error that's
 *     raised when used in production code.
 */
goog.setTestOnly = function(opt_message) {
  if (goog.DISALLOW_TEST_ONLY_CODE) {
    opt_message = opt_message || '';
    throw Error('Importing test-only code into non-debug environment' +
                (opt_message ? ': ' + opt_message : '.'));
  }
};


/**
 * Forward declares a symbol. This is an indication to the compiler that the
 * symbol may be used in the source yet is not required and may not be provided
 * in compilation.
 *
 * The most common usage of forward declaration is code that takes a type as a
 * function parameter but does not need to require it. By forward declaring
 * instead of requiring, no hard dependency is made, and (if not required
 * elsewhere) the namespace may never be required and thus, not be pulled
 * into the JavaScript binary. If it is required elsewhere, it will be type
 * checked as normal.
 *
 *
 * @param {string} name The namespace to forward declare in the form of
 *     "goog.package.part".
 */
goog.forwardDeclare = function(name) {};


/**
 * Forward declare type information. Used to assign types to goog.global
 * referenced object that would otherwise result in unknown type references
 * and thus block property disambiguation.
 */
goog.forwardDeclare('Document');
goog.forwardDeclare('XMLHttpRequest');


if (!COMPILED) {

  /**
   * Check if the given name has been goog.provided. This will return false for
   * names that are available only as implicit namespaces.
   * @param {string} name name of the object to look for.
   * @return {boolean} Whether the name has been provided.
   * @private
   */
  goog.isProvided_ = function(name) {
    return (name in goog.loadedModules_) ||
        (!goog.implicitNamespaces_[name] &&
            goog.isDefAndNotNull(goog.getObjectByName(name)));
  };

  /**
   * Namespaces implicitly defined by goog.provide. For example,
   * goog.provide('goog.events.Event') implicitly declares that 'goog' and
   * 'goog.events' must be namespaces.
   *
   * @type {!Object<string, (boolean|undefined)>}
   * @private
   */
  goog.implicitNamespaces_ = {'goog.module': true};

  // NOTE: We add goog.module as an implicit namespace as goog.module is defined
  // here and because the existing module package has not been moved yet out of
  // the goog.module namespace. This satisifies both the debug loader and
  // ahead-of-time dependency management.
}


/**
 * Returns an object based on its fully qualified external name.  The object
 * is not found if null or undefined.  If you are using a compilation pass that
 * renames property names beware that using this function will not find renamed
 * properties.
 *
 * @param {string} name The fully qualified name.
 * @param {Object=} opt_obj The object within which to look; default is
 *     |goog.global|.
 * @return {?} The value (object or primitive) or, if not found, null.
 */
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || goog.global;
  for (var part; part = parts.shift(); ) {
    if (goog.isDefAndNotNull(cur[part])) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * Globalizes a whole namespace, such as goog or goog.lang.
 *
 * @param {!Object} obj The namespace to globalize.
 * @param {Object=} opt_global The object to add the properties to.
 * @deprecated Properties may be explicitly exported to the global scope, but
 *     this should no longer be done in bulk.
 */
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};


/**
 * Adds a dependency from a file to the files it requires.
 * @param {string} relPath The path to the js file.
 * @param {!Array<string>} provides An array of strings with
 *     the names of the objects this file provides.
 * @param {!Array<string>} requires An array of strings with
 *     the names of the objects this file requires.
 * @param {boolean=} opt_isModule Whether this dependency must be loaded as
 *     a module as declared by goog.module.
 */
goog.addDependency = function(relPath, provides, requires, opt_isModule) {
  if (goog.DEPENDENCIES_ENABLED) {
    var provide, require;
    var path = relPath.replace(/\\/g, '/');
    var deps = goog.dependencies_;
    for (var i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      deps.pathIsModule[path] = !!opt_isModule;
    }
    for (var j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};




// NOTE(nnaze): The debug DOM loader was included in base.js as an original way
// to do "debug-mode" development.  The dependency system can sometimes be
// confusing, as can the debug DOM loader's asynchronous nature.
//
// With the DOM loader, a call to goog.require() is not blocking -- the script
// will not load until some point after the current script.  If a namespace is
// needed at runtime, it needs to be defined in a previous script, or loaded via
// require() with its registered dependencies.
// User-defined namespaces may need their own deps file.  See http://go/js_deps,
// http://go/genjsdeps, or, externally, DepsWriter.
// https://developers.google.com/closure/library/docs/depswriter
//
// Because of legacy clients, the DOM loader can't be easily removed from
// base.js.  Work is being done to make it disableable or replaceable for
// different environments (DOM-less JavaScript interpreters like Rhino or V8,
// for example). See bootstrap/ for more information.


/**
 * @define {boolean} Whether to enable the debug loader.
 *
 * If enabled, a call to goog.require() will attempt to load the namespace by
 * appending a script tag to the DOM (if the namespace has been registered).
 *
 * If disabled, goog.require() will simply assert that the namespace has been
 * provided (and depend on the fact that some outside tool correctly ordered
 * the script).
 */
goog.define('goog.ENABLE_DEBUG_LOADER', true);


/**
 * @param {string} msg
 * @private
 */
goog.logToConsole_ = function(msg) {
  if (goog.global.console) {
    goog.global.console['error'](msg);
  }
};


/**
 * Implements a system for the dynamic resolution of dependencies that works in
 * parallel with the BUILD system. Note that all calls to goog.require will be
 * stripped by the JSCompiler when the --closure_pass option is used.
 * @see goog.provide
 * @param {string} name Namespace to include (as was given in goog.provide()) in
 *     the form "goog.package.part".
 * @return {?} If called within a goog.module file, the associated namespace or
 *     module otherwise null.
 */
goog.require = function(name) {

  // If the object already exists we do not need do do anything.
  if (!COMPILED) {
    if (goog.ENABLE_DEBUG_LOADER && goog.IS_OLD_IE_) {
      goog.maybeProcessDeferredDep_(name);
    }

    if (goog.isProvided_(name)) {
      if (goog.isInModuleLoader_()) {
        return goog.module.getInternal_(name);
      } else {
        return null;
      }
    }

    if (goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if (path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return null;
      }
    }

    var errorMessage = 'goog.require could not find: ' + name;
    goog.logToConsole_(errorMessage);

    throw Error(errorMessage);
  }
};


/**
 * Path for included scripts.
 * @type {string}
 */
goog.basePath = '';


/**
 * A hook for overriding the base path.
 * @type {string|undefined}
 */
goog.global.CLOSURE_BASE_PATH;


/**
 * Whether to write out Closure's deps file. By default, the deps are written.
 * @type {boolean|undefined}
 */
goog.global.CLOSURE_NO_DEPS;


/**
 * A function to import a single script. This is meant to be overridden when
 * Closure is being run in non-HTML contexts, such as web workers. It's defined
 * in the global scope so that it can be set before base.js is loaded, which
 * allows deps.js to be imported properly.
 *
 * The function is passed the script source, which is a relative URI. It should
 * return true if the script was imported, false otherwise.
 * @type {(function(string): boolean)|undefined}
 */
goog.global.CLOSURE_IMPORT_SCRIPT;


/**
 * Null function used for default values of callbacks, etc.
 * @return {void} Nothing.
 */
goog.nullFunction = function() {};


/**
 * When defining a class Foo with an abstract method bar(), you can do:
 * Foo.prototype.bar = goog.abstractMethod
 *
 * Now if a subclass of Foo fails to override bar(), an error will be thrown
 * when bar() is invoked.
 *
 * Note: This does not take the name of the function to override as an argument
 * because that would make it more difficult to obfuscate our JavaScript code.
 *
 * @type {!Function}
 * @throws {Error} when invoked to indicate the method should be overridden.
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};


/**
 * Adds a {@code getInstance} static method that always returns the same
 * instance object.
 * @param {!Function} ctor The constructor for the class to add the static
 *     method to.
 */
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if (ctor.instance_) {
      return ctor.instance_;
    }
    if (goog.DEBUG) {
      // NOTE: JSCompiler can't optimize away Array#push.
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor;
    }
    return ctor.instance_ = new ctor;
  };
};


/**
 * All singleton classes that have been instantiated, for testing. Don't read
 * it directly, use the {@code goog.testing.singleton} module. The compiler
 * removes this variable if unused.
 * @type {!Array<!Function>}
 * @private
 */
goog.instantiatedSingletons_ = [];


/**
 * @define {boolean} Whether to load goog.modules using {@code eval} when using
 * the debug loader.  This provides a better debugging experience as the
 * source is unmodified and can be edited using Chrome Workspaces or similar.
 * However in some environments the use of {@code eval} is banned
 * so we provide an alternative.
 */
goog.define('goog.LOAD_MODULE_USING_EVAL', true);


/**
 * @define {boolean} Whether the exports of goog.modules should be sealed when
 * possible.
 */
goog.define('goog.SEAL_MODULE_EXPORTS', goog.DEBUG);


/**
 * The registry of initialized modules:
 * the module identifier to module exports map.
 * @private @const {!Object<string, ?>}
 */
goog.loadedModules_ = {};


/**
 * True if goog.dependencies_ is available.
 * @const {boolean}
 */
goog.DEPENDENCIES_ENABLED = !COMPILED && goog.ENABLE_DEBUG_LOADER;


if (goog.DEPENDENCIES_ENABLED) {
  /**
   * Object used to keep track of urls that have already been added. This record
   * allows the prevention of circular dependencies.
   * @private {!Object<string, boolean>}
   */
  goog.included_ = {};


  /**
   * This object is used to keep track of dependencies and other data that is
   * used for loading scripts.
   * @private
   * @type {{
   *   pathIsModule: !Object<string, boolean>,
   *   nameToPath: !Object<string, string>,
   *   requires: !Object<string, !Object<string, boolean>>,
   *   visited: !Object<string, boolean>,
   *   written: !Object<string, boolean>,
   *   deferred: !Object<string, string>
   * }}
   */
  goog.dependencies_ = {
    pathIsModule: {}, // 1 to 1

    nameToPath: {}, // 1 to 1

    requires: {}, // 1 to many

    // Used when resolving dependencies to prevent us from visiting file twice.
    visited: {},

    written: {}, // Used to keep track of script files we have written.

    deferred: {} // Used to track deferred module evaluations in old IEs
  };


  /**
   * Tries to detect whether is in the context of an HTML document.
   * @return {boolean} True if it looks like HTML document.
   * @private
   */
  goog.inHtmlDocument_ = function() {
    /** @type {Document} */
    var doc = goog.global.document;
    return typeof doc != 'undefined' &&
           'write' in doc;  // XULDocument misses write.
  };


  /**
   * Tries to detect the base path of base.js script that bootstraps Closure.
   * @private
   */
  goog.findBasePath_ = function() {
    if (goog.isDef(goog.global.CLOSURE_BASE_PATH)) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    } else if (!goog.inHtmlDocument_()) {
      return;
    }
    /** @type {Document} */
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName('SCRIPT');
    // Search backwards since the current script is in almost all cases the one
    // that has base.js.
    for (var i = scripts.length - 1; i >= 0; --i) {
      var script = /** @type {!HTMLScriptElement} */ (scripts[i]);
      var src = script.src;
      var qmark = src.lastIndexOf('?');
      var l = qmark == -1 ? src.length : qmark;
      if (src.substr(l - 7, 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };


  /**
   * Imports a script if, and only if, that script hasn't already been imported.
   * (Must be called at execution time)
   * @param {string} src Script source.
   * @param {string=} opt_sourceText The optionally source text to evaluate
   * @private
   */
  goog.importScript_ = function(src, opt_sourceText) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT ||
        goog.writeScriptTag_;
    if (importScript(src, opt_sourceText)) {
      goog.dependencies_.written[src] = true;
    }
  };


  /** @const @private {boolean} */
  goog.IS_OLD_IE_ = !!(!goog.global.atob && goog.global.document &&
      goog.global.document.all);


  /**
   * Given a URL initiate retrieval and execution of the module.
   * @param {string} src Script source URL.
   * @private
   */
  goog.importModule_ = function(src) {
    // In an attempt to keep browsers from timing out loading scripts using
    // synchronous XHRs, put each load in its own script block.
    var bootstrap = 'goog.retrieveAndExecModule_("' + src + '");';

    if (goog.importScript_('', bootstrap)) {
      goog.dependencies_.written[src] = true;
    }
  };


  /** @private {!Array<string>} */
  goog.queuedModules_ = [];


  /**
   * Return an appropriate module text. Suitable to insert into
   * a script tag (that is unescaped).
   * @param {string} srcUrl
   * @param {string} scriptText
   * @return {string}
   * @private
   */
  goog.wrapModule_ = function(srcUrl, scriptText) {
    if (!goog.LOAD_MODULE_USING_EVAL || !goog.isDef(goog.global.JSON)) {
      return '' +
          'goog.loadModule(function(exports) {' +
          '"use strict";' +
          scriptText +
          '\n' + // terminate any trailing single line comment.
          ';return exports' +
          '});' +
          '\n//# sourceURL=' + srcUrl + '\n';
    } else {
      return '' +
          'goog.loadModule(' +
          goog.global.JSON.stringify(
              scriptText + '\n//# sourceURL=' + srcUrl + '\n') +
          ');';
    }
  };

  // On IE9 and earlier, it is necessary to handle
  // deferred module loads. In later browsers, the
  // code to be evaluated is simply inserted as a script
  // block in the correct order. To eval deferred
  // code at the right time, we piggy back on goog.require to call
  // goog.maybeProcessDeferredDep_.
  //
  // The goog.requires are used both to bootstrap
  // the loading process (when no deps are available) and
  // declare that they should be available.
  //
  // Here we eval the sources, if all the deps are available
  // either already eval'd or goog.require'd.  This will
  // be the case when all the dependencies have already
  // been loaded, and the dependent module is loaded.
  //
  // But this alone isn't sufficient because it is also
  // necessary to handle the case where there is no root
  // that is not deferred.  For that there we register for an event
  // and trigger goog.loadQueuedModules_ handle any remaining deferred
  // evaluations.

  /**
   * Handle any remaining deferred goog.module evals.
   * @private
   */
  goog.loadQueuedModules_ = function() {
    var count = goog.queuedModules_.length;
    if (count > 0) {
      var queue = goog.queuedModules_;
      goog.queuedModules_ = [];
      for (var i = 0; i < count; i++) {
        var path = queue[i];
        goog.maybeProcessDeferredPath_(path);
      }
    }
  };


  /**
   * Eval the named module if its dependencies are
   * available.
   * @param {string} name The module to load.
   * @private
   */
  goog.maybeProcessDeferredDep_ = function(name) {
    if (goog.isDeferredModule_(name) &&
        goog.allDepsAreAvailable_(name)) {
      var path = goog.getPathFromDeps_(name);
      goog.maybeProcessDeferredPath_(goog.basePath + path);
    }
  };

  /**
   * @param {string} name The module to check.
   * @return {boolean} Whether the name represents a
   *     module whose evaluation has been deferred.
   * @private
   */
  goog.isDeferredModule_ = function(name) {
    var path = goog.getPathFromDeps_(name);
    if (path && goog.dependencies_.pathIsModule[path]) {
      var abspath = goog.basePath + path;
      return (abspath) in goog.dependencies_.deferred;
    }
    return false;
  };

  /**
   * @param {string} name The module to check.
   * @return {boolean} Whether the name represents a
   *     module whose declared dependencies have all been loaded
   *     (eval'd or a deferred module load)
   * @private
   */
  goog.allDepsAreAvailable_ = function(name) {
    var path = goog.getPathFromDeps_(name);
    if (path && (path in goog.dependencies_.requires)) {
      for (var requireName in goog.dependencies_.requires[path]) {
        if (!goog.isProvided_(requireName) &&
            !goog.isDeferredModule_(requireName)) {
          return false;
        }
      }
    }
    return true;
  };


  /**
   * @param {string} abspath
   * @private
   */
  goog.maybeProcessDeferredPath_ = function(abspath) {
    if (abspath in goog.dependencies_.deferred) {
      var src = goog.dependencies_.deferred[abspath];
      delete goog.dependencies_.deferred[abspath];
      goog.globalEval(src);
    }
  };


  /**
   * @param {function(?):?|string} moduleDef The module definition.
   */
  goog.loadModule = function(moduleDef) {
    // NOTE: we allow function definitions to be either in the from
    // of a string to eval (which keeps the original source intact) or
    // in a eval forbidden environment (CSP) we allow a function definition
    // which in its body must call {@code goog.module}, and return the exports
    // of the module.
    var previousState = goog.moduleLoaderState_;
    try {
      goog.moduleLoaderState_ = {moduleName: undefined};
      var exports;
      if (goog.isFunction(moduleDef)) {
        exports = moduleDef.call(goog.global, {});
      } else if (goog.isString(moduleDef)) {
        exports = goog.loadModuleFromSource_.call(goog.global, moduleDef);
      } else {
        throw Error('Invalid module definition');
      }

      var moduleName = goog.moduleLoaderState_.moduleName;
      if (!goog.isString(moduleName) || !moduleName) {
        throw Error('Invalid module name \"' + moduleName + '\"');
      }

      // Don't seal legacy namespaces as they may be uses as a parent of
      // another namespace
      if (goog.moduleLoaderState_.declareLegacyNamespace) {
        goog.constructNamespace_(moduleName, exports);
      } else if (goog.SEAL_MODULE_EXPORTS && Object.seal) {
        Object.seal(exports);
      }

      goog.loadedModules_[moduleName] = exports;
    } finally {
      goog.moduleLoaderState_ = previousState;
    }
  };


  /**
   * @private @const {function(string):?}
   */
  goog.loadModuleFromSource_ = function() {
    // NOTE: we avoid declaring parameters or local variables here to avoid
    // masking globals or leaking values into the module definition.
    'use strict';
    var exports = {};
    eval(arguments[0]);
    return exports;
  };


  /**
   * Writes a new script pointing to {@code src} directly into the DOM.
   *
   * NOTE: This method is not CSP-compliant. @see goog.appendScriptSrcNode_ for
   * the fallback mechanism.
   *
   * @param {string} src The script URL.
   * @private
   */
  goog.writeScriptSrcNode_ = function(src) {
    goog.global.document.write(
        '<script type="text/javascript" src="' + src + '"></' + 'script>');
  };


  /**
   * Appends a new script node to the DOM using a CSP-compliant mechanism. This
   * method exists as a fallback for document.write (which is not allowed in a
   * strict CSP context, e.g., Chrome apps).
   *
   * NOTE: This method is not analogous to using document.write to insert a
   * <script> tag; specifically, the user agent will execute a script added by
   * document.write immediately after the current script block finishes
   * executing, whereas the DOM-appended script node will not be executed until
   * the entire document is parsed and executed. That is to say, this script is
   * added to the end of the script execution queue.
   *
   * The page must not attempt to call goog.required entities until after the
   * document has loaded, e.g., in or after the window.onload callback.
   *
   * @param {string} src The script URL.
   * @private
   */
  goog.appendScriptSrcNode_ = function(src) {
    /** @type {Document} */
    var doc = goog.global.document;
    var scriptEl = doc.createElement('script');
    scriptEl.type = 'text/javascript';
    scriptEl.src = src;
    scriptEl.defer = false;
    scriptEl.async = false;
    doc.head.appendChild(scriptEl);
  };


  /**
   * The default implementation of the import function. Writes a script tag to
   * import the script.
   *
   * @param {string} src The script url.
   * @param {string=} opt_sourceText The optionally source text to evaluate
   * @return {boolean} True if the script was imported, false otherwise.
   * @private
   */
  goog.writeScriptTag_ = function(src, opt_sourceText) {
    if (goog.inHtmlDocument_()) {
      /** @type {Document} */
      var doc = goog.global.document;

      // If the user tries to require a new symbol after document load,
      // something has gone terribly wrong. Doing a document.write would
      // wipe out the page. This does not apply to the CSP-compliant method
      // of writing script tags.
      if (!goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING &&
          doc.readyState == 'complete') {
        // Certain test frameworks load base.js multiple times, which tries
        // to write deps.js each time. If that happens, just fail silently.
        // These frameworks wipe the page between each load of base.js, so this
        // is OK.
        var isDeps = /\bdeps.js$/.test(src);
        if (isDeps) {
          return false;
        } else {
          throw Error('Cannot write "' + src + '" after document load');
        }
      }

      var isOldIE = goog.IS_OLD_IE_;

      if (opt_sourceText === undefined) {
        if (!isOldIE) {
          if (goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING) {
            goog.appendScriptSrcNode_(src);
          } else {
            goog.writeScriptSrcNode_(src);
          }
        } else {
          var state = " onreadystatechange='goog.onScriptLoad_(this, " +
              ++goog.lastNonModuleScriptIndex_ + ")' ";
          doc.write(
              '<script type="text/javascript" src="' +
                  src + '"' + state + '></' + 'script>');
        }
      } else {
        doc.write(
            '<script type="text/javascript">' +
            opt_sourceText +
            '</' + 'script>');
      }
      return true;
    } else {
      return false;
    }
  };


  /** @private {number} */
  goog.lastNonModuleScriptIndex_ = 0;


  /**
   * A readystatechange handler for legacy IE
   * @param {!HTMLScriptElement} script
   * @param {number} scriptIndex
   * @return {boolean}
   * @private
   */
  goog.onScriptLoad_ = function(script, scriptIndex) {
    // for now load the modules when we reach the last script,
    // later allow more inter-mingling.
    if (script.readyState == 'complete' &&
        goog.lastNonModuleScriptIndex_ == scriptIndex) {
      goog.loadQueuedModules_();
    }
    return true;
  };

  /**
   * Resolves dependencies based on the dependencies added using addDependency
   * and calls importScript_ in the correct order.
   * @private
   */
  goog.writeScripts_ = function() {
    /** @type {!Array<string>} The scripts we need to write this time. */
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;

    /** @param {string} path */
    function visitNode(path) {
      if (path in deps.written) {
        return;
      }

      // We have already visited this one. We can get here if we have cyclic
      // dependencies.
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }

      deps.visited[path] = true;

      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          // If the required name is defined, we assume that it was already
          // bootstrapped by other means.
          if (!goog.isProvided_(requireName)) {
            if (requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName]);
            } else {
              throw Error('Undefined nameToPath for ' + requireName);
            }
          }
        }
      }

      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }

    for (var path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }

    // record that we are going to load all these scripts.
    for (var i = 0; i < scripts.length; i++) {
      var path = scripts[i];
      goog.dependencies_.written[path] = true;
    }

    // If a module is loaded synchronously then we need to
    // clear the current inModuleLoader value, and restore it when we are
    // done loading the current "requires".
    var moduleState = goog.moduleLoaderState_;
    goog.moduleLoaderState_ = null;

    var loadingModule = false;
    for (var i = 0; i < scripts.length; i++) {
      var path = scripts[i];
      if (path) {
        if (!deps.pathIsModule[path]) {
          goog.importScript_(goog.basePath + path);
        } else {
          loadingModule = true;
          goog.importModule_(goog.basePath + path);
        }
      } else {
        goog.moduleLoaderState_ = moduleState;
        throw Error('Undefined script input');
      }
    }

    // restore the current "module loading state"
    goog.moduleLoaderState_ = moduleState;
  };


  /**
   * Looks at the dependency rules and tries to determine the script file that
   * fulfills a particular rule.
   * @param {string} rule In the form goog.namespace.Class or project.script.
   * @return {?string} Url corresponding to the rule, or null.
   * @private
   */
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };

  goog.findBasePath_();

  // Allow projects to manage the deps files themselves.
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + 'deps.js');
  }
}


/**
 * Normalize a file path by removing redundant ".." and extraneous "." file
 * path components.
 * @param {string} path
 * @return {string}
 * @private
 */
goog.normalizePath_ = function(path) {
  var components = path.split('/');
  var i = 0;
  while (i < components.length) {
    if (components[i] == '.') {
      components.splice(i, 1);
    } else if (i && components[i] == '..' &&
        components[i - 1] && components[i - 1] != '..') {
      components.splice(--i, 2);
    } else {
      i++;
    }
  }
  return components.join('/');
};


/**
 * Loads file by synchronous XHR. Should not be used in production environments.
 * @param {string} src Source URL.
 * @return {string} File contents.
 * @private
 */
goog.loadFileSync_ = function(src) {
  if (goog.global.CLOSURE_LOAD_FILE_SYNC) {
    return goog.global.CLOSURE_LOAD_FILE_SYNC(src);
  } else {
    /** @type {XMLHttpRequest} */
    var xhr = new goog.global['XMLHttpRequest']();
    xhr.open('get', src, false);
    xhr.send();
    return xhr.responseText;
  }
};


/**
 * Retrieve and execute a module.
 * @param {string} src Script source URL.
 * @private
 */
goog.retrieveAndExecModule_ = function(src) {
  if (!COMPILED) {
    // The full but non-canonicalized URL for later use.
    var originalPath = src;
    // Canonicalize the path, removing any /./ or /../ since Chrome's debugging
    // console doesn't auto-canonicalize XHR loads as it does <script> srcs.
    src = goog.normalizePath_(src);

    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT ||
        goog.writeScriptTag_;

    var scriptText = goog.loadFileSync_(src);

    if (scriptText != null) {
      var execModuleScript = goog.wrapModule_(src, scriptText);
      var isOldIE = goog.IS_OLD_IE_;
      if (isOldIE) {
        goog.dependencies_.deferred[originalPath] = execModuleScript;
        goog.queuedModules_.push(originalPath);
      } else {
        importScript(src, execModuleScript);
      }
    } else {
      throw new Error('load of ' + src + 'failed');
    }
  }
};


//==============================================================================
// Language Enhancements
//==============================================================================


/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param {*} value The value to get the type of.
 * @return {string} The name of the type.
 */
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      // Check these first, so we can avoid calling Object.prototype.toString if
      // possible.
      //
      // IE improperly marshals tyepof across execution contexts, but a
      // cross-context object will still return false for "instanceof Object".
      if (value instanceof Array) {
        return 'array';
      } else if (value instanceof Object) {
        return s;
      }

      // HACK: In order to use an Object prototype method on the arbitrary
      //   value, the compiler requires the value be cast to type Object,
      //   even though the ECMA spec explicitly allows it.
      var className = Object.prototype.toString.call(
          /** @type {Object} */ (value));
      // In Firefox 3.6, attempting to access iframe window objects' length
      // property throws an NS_ERROR_FAILURE, so we need to special-case it
      // here.
      if (className == '[object Window]') {
        return 'object';
      }

      // We cannot always use constructor == Array or instanceof Array because
      // different frames have different Array objects. In IE6, if the iframe
      // where the array was created is destroyed, the array loses its
      // prototype. Then dereferencing val.splice here throws an exception, so
      // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
      // so that will work. In this case, this function will return false and
      // most array functions will still work because the array is still
      // array-like (supports length and []) even though it has lost its
      // prototype.
      // Mark Miller noticed that Object.prototype.toString
      // allows access to the unforgeable [[Class]] property.
      //  15.2.4.2 Object.prototype.toString ( )
      //  When the toString method is called, the following steps are taken:
      //      1. Get the [[Class]] property of this object.
      //      2. Compute a string value by concatenating the three strings
      //         "[object ", Result(1), and "]".
      //      3. Return Result(2).
      // and this behavior survives the destruction of the execution context.
      if ((className == '[object Array]' ||
           // In IE all non value types are wrapped as objects across window
           // boundaries (not iframe though) so we have to do object detection
           // for this edge case.
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      // HACK: There is still an array case that fails.
      //     function ArrayImpostor() {}
      //     ArrayImpostor.prototype = [];
      //     var impostor = new ArrayImpostor;
      // this can be fixed by getting rid of the fast path
      // (value instanceof Array) and solely relying on
      // (value && Object.prototype.toString.vall(value) === '[object Array]')
      // but that would require many more function calls and is not warranted
      // unless closure code is receiving objects from untrusted sources.

      // IE in cross-window calls does not correctly marshal the function type
      // (it appears just as an object) so we cannot use just typeof val ==
      // 'function'. However, if the object has a call property, it is a
      // function.
      if ((className == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }

    } else {
      return 'null';
    }

  } else if (s == 'function' && typeof value.call == 'undefined') {
    // In Safari typeof nodeList returns 'function', and on Firefox typeof
    // behaves similarly for HTML{Applet,Embed,Object}, Elements and RegExps. We
    // would like to return object for those and we can detect an invalid
    // function by making sure that the function object has a call method.
    return 'object';
  }
  return s;
};


/**
 * Returns true if the specified value is null.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is null.
 */
goog.isNull = function(val) {
  return val === null;
};


/**
 * Returns true if the specified value is defined and not null.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is defined and not null.
 */
goog.isDefAndNotNull = function(val) {
  // Note that undefined == null.
  return val != null;
};


/**
 * Returns true if the specified value is an array.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArray = function(val) {
  return goog.typeOf(val) == 'array';
};


/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property. As a special case, a function value is not array like, because its
 * length property is fixed to correspond to the number of expected arguments.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  // We do not use goog.isObject here in order to exclude function values.
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};


/**
 * Returns true if the object looks like a Date. To qualify as Date-like the
 * value needs to be an object and have a getFullYear() function.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is a like a Date.
 */
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};


/**
 * Returns true if the specified value is a string.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
goog.isString = function(val) {
  return typeof val == 'string';
};


/**
 * Returns true if the specified value is a boolean.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
goog.isBoolean = function(val) {
  return typeof val == 'boolean';
};


/**
 * Returns true if the specified value is a number.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is a number.
 */
goog.isNumber = function(val) {
  return typeof val == 'number';
};


/**
 * Returns true if the specified value is a function.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
goog.isFunction = function(val) {
  return goog.typeOf(val) == 'function';
};


/**
 * Returns true if the specified value is an object.  This includes arrays and
 * functions.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
goog.isObject = function(val) {
  var type = typeof val;
  return type == 'object' && val != null || type == 'function';
  // return Object(val) === val also works, but is slower, especially if val is
  // not an object.
};


/**
 * Gets a unique ID for an object. This mutates the object so that further calls
 * with the same object as a parameter returns the same value. The unique ID is
 * guaranteed to be unique across the current session amongst objects that are
 * passed into {@code getUid}. There is no guarantee that the ID is unique or
 * consistent across sessions. It is unsafe to generate unique ID for function
 * prototypes.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {number} The unique ID for the object.
 */
goog.getUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // In Opera window.hasOwnProperty exists but always returns false so we avoid
  // using it. As a consequence the unique ID generated for BaseClass.prototype
  // and SubClass.prototype will be the same.
  return obj[goog.UID_PROPERTY_] ||
      (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};


/**
 * Whether the given object is already assigned a unique ID.
 *
 * This does not modify the object.
 *
 * @param {!Object} obj The object to check.
 * @return {boolean} Whether there is an assigned unique id for the object.
 */
goog.hasUid = function(obj) {
  return !!obj[goog.UID_PROPERTY_];
};


/**
 * Removes the unique ID from an object. This is useful if the object was
 * previously mutated using {@code goog.getUid} in which case the mutation is
 * undone.
 * @param {Object} obj The object to remove the unique ID field from.
 */
goog.removeUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // In IE, DOM nodes are not instances of Object and throw an exception if we
  // try to delete.  Instead we try to use removeAttribute.
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  /** @preserveTry */
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};


/**
 * Name for unique ID property. Initialized in a way to help avoid collisions
 * with other closure JavaScript on the same page.
 * @type {string}
 * @private
 */
goog.UID_PROPERTY_ = 'closure_uid_' + ((Math.random() * 1e9) >>> 0);


/**
 * Counter for UID.
 * @type {number}
 * @private
 */
goog.uidCounter_ = 0;


/**
 * Adds a hash code field to an object. The hash code is unique for the
 * given object.
 * @param {Object} obj The object to get the hash code for.
 * @return {number} The hash code for the object.
 * @deprecated Use goog.getUid instead.
 */
goog.getHashCode = goog.getUid;


/**
 * Removes the hash code field from an object.
 * @param {Object} obj The object to remove the field from.
 * @deprecated Use goog.removeUid instead.
 */
goog.removeHashCode = goog.removeUid;


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.cloneObject</code> does not detect reference loops. Objects that
 * refer to themselves will cause infinite recursion.
 *
 * <code>goog.cloneObject</code> is unaware of unique identifiers, and copies
 * UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 * @deprecated goog.cloneObject is unsafe. Prefer the goog.object methods.
 */
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * A native implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which this should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially applied to the
 *     function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 * @suppress {deprecated} The compiler thinks that Function.prototype.bind is
 *     deprecated because some people have declared a pure-JS version.
 *     Only the pure-JS version is truly deprecated.
 */
goog.bindNative_ = function(fn, selfObj, var_args) {
  return /** @type {!Function} */ (fn.call.apply(fn.bind, arguments));
};


/**
 * A pure-JS implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which this should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially applied to the
 *     function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 */
goog.bindJs_ = function(fn, selfObj, var_args) {
  if (!fn) {
    throw new Error();
  }

  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs);
    };

  } else {
    return function() {
      return fn.apply(selfObj, arguments);
    };
  }
};


/**
 * Partially applies this function to a particular 'this object' and zero or
 * more arguments. The result is a new function with some arguments of the first
 * function pre-filled and the value of this 'pre-specified'.
 *
 * Remaining arguments specified at call-time are appended to the pre-specified
 * ones.
 *
 * Also see: {@link #partial}.
 *
 * Usage:
 * <pre>var barMethBound = bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');</pre>
 *
 * @param {?function(this:T, ...)} fn A function to partially apply.
 * @param {T} selfObj Specifies the object which this should point to when the
 *     function is run.
 * @param {...*} var_args Additional arguments that are partially applied to the
 *     function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @template T
 * @suppress {deprecated} See above.
 */
goog.bind = function(fn, selfObj, var_args) {
  // TODO(nicksantos): narrow the type signature.
  if (Function.prototype.bind &&
      // NOTE(nicksantos): Somebody pulled base.js into the default Chrome
      // extension environment. This means that for Chrome extensions, they get
      // the implementation of Function.prototype.bind that calls goog.bind
      // instead of the native one. Even worse, we don't want to introduce a
      // circular dependency between goog.bind and Function.prototype.bind, so
      // we have to hack this to make sure it works correctly.
      Function.prototype.bind.toString().indexOf('native code') != -1) {
    goog.bind = goog.bindNative_;
  } else {
    goog.bind = goog.bindJs_;
  }
  return goog.bind.apply(null, arguments);
};


/**
 * Like bind(), except that a 'this object' is not required. Useful when the
 * target function is already bound.
 *
 * Usage:
 * var g = partial(f, arg1, arg2);
 * g(arg3, arg4);
 *
 * @param {Function} fn A function to partially apply.
 * @param {...*} var_args Additional arguments that are partially applied to fn.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    // Clone the array (with slice()) and append additional arguments
    // to the existing arguments.
    var newArgs = args.slice();
    newArgs.push.apply(newArgs, arguments);
    return fn.apply(this, newArgs);
  };
};


/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use goog.object.extend for this purpose.
 * @param {Object} target Target.
 * @param {Object} source Source.
 */
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }

  // For IE7 or lower, the for-in-loop does not contain any properties that are
  // not enumerable on the prototype object (for example, isPrototypeOf from
  // Object.prototype) but also it will not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
};


/**
 * @return {number} An integer value representing the number of milliseconds
 *     between midnight, January 1, 1970 and the current time.
 */
goog.now = (goog.TRUSTED_SITE && Date.now) || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});


/**
 * Evals JavaScript in the global scope.  In IE this uses execScript, other
 * browsers use goog.global.eval. If goog.global.eval does not evaluate in the
 * global scope (for example, in Safari), appends a script tag instead.
 * Throws an exception if neither execScript or eval is defined.
 * @param {string} script JavaScript string.
 */
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, 'JavaScript');
  } else if (goog.global.eval) {
    // Test to see if eval works
    if (goog.evalWorksForGlobals_ == null) {
      goog.global.eval('var _evalTest_ = 1;');
      if (typeof goog.global['_evalTest_'] != 'undefined') {
        try {
          delete goog.global['_evalTest_'];
        } catch (ignore) {
          // Microsoft edge fails the deletion above in strict mode.
        }
        goog.evalWorksForGlobals_ = true;
      } else {
        goog.evalWorksForGlobals_ = false;
      }
    }

    if (goog.evalWorksForGlobals_) {
      goog.global.eval(script);
    } else {
      /** @type {Document} */
      var doc = goog.global.document;
      var scriptElt = doc.createElement('SCRIPT');
      scriptElt.type = 'text/javascript';
      scriptElt.defer = false;
      // Note(user): can't use .innerHTML since "t('<test>')" will fail and
      // .text doesn't work in Safari 2.  Therefore we append a text node.
      scriptElt.appendChild(doc.createTextNode(script));
      doc.body.appendChild(scriptElt);
      doc.body.removeChild(scriptElt);
    }
  } else {
    throw Error('goog.globalEval not available');
  }
};


/**
 * Indicates whether or not we can call 'eval' directly to eval code in the
 * global scope. Set to a Boolean by the first call to goog.globalEval (which
 * empirically tests whether eval works for globals). @see goog.globalEval
 * @type {?boolean}
 * @private
 */
goog.evalWorksForGlobals_ = null;


/**
 * Optional map of CSS class names to obfuscated names used with
 * goog.getCssName().
 * @private {!Object<string, string>|undefined}
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;


/**
 * Optional obfuscation style for CSS class names. Should be set to either
 * 'BY_WHOLE' or 'BY_PART' if defined.
 * @type {string|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMappingStyle_;


/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * This function works in tandem with @see goog.setCssNameMapping.
 *
 * Without any mapping set, the arguments are simple joined with a hyphen and
 * passed through unaltered.
 *
 * When there is a mapping, there are two possible styles in which these
 * mappings are used. In the BY_PART style, each part (i.e. in between hyphens)
 * of the passed in css name is rewritten according to the map. In the BY_WHOLE
 * style, the full css name is looked up in the map directly. If a rewrite is
 * not specified by the map, the compiler will output a warning.
 *
 * When the mapping is passed to the compiler, it will replace calls to
 * goog.getCssName with the strings from the mapping, e.g.
 *     var x = goog.getCssName('foo');
 *     var y = goog.getCssName(this.baseClass, 'active');
 *  becomes:
 *     var x= 'foo';
 *     var y = this.baseClass + '-active';
 *
 * If one argument is passed it will be processed, if two are passed only the
 * modifier will be processed, as it is assumed the first argument was generated
 * as a result of calling goog.getCssName.
 *
 * @param {string} className The class name.
 * @param {string=} opt_modifier A modifier to be appended to the class name.
 * @return {string} The class name or the concatenation of the class name and
 *     the modifier.
 */
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  };

  var renameByParts = function(cssName) {
    // Remap all the parts individually.
    var parts = cssName.split('-');
    var mapped = [];
    for (var i = 0; i < parts.length; i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join('-');
  };

  var rename;
  if (goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == 'BY_WHOLE' ?
        getMapping : renameByParts;
  } else {
    rename = function(a) {
      return a;
    };
  }

  if (opt_modifier) {
    return className + '-' + rename(opt_modifier);
  } else {
    return rename(className);
  }
};


/**
 * Sets the map to check when returning a value from goog.getCssName(). Example:
 * <pre>
 * goog.setCssNameMapping({
 *   "goog": "a",
 *   "disabled": "b",
 * });
 *
 * var x = goog.getCssName('goog');
 * // The following evaluates to: "a a-b".
 * goog.getCssName('goog') + ' ' + goog.getCssName(x, 'disabled')
 * </pre>
 * When declared as a map of string literals to string literals, the JSCompiler
 * will replace all calls to goog.getCssName() using the supplied map if the
 * --closure_pass flag is set.
 *
 * @param {!Object} mapping A map of strings to strings where keys are possible
 *     arguments to goog.getCssName() and values are the corresponding values
 *     that should be returned.
 * @param {string=} opt_style The style of css name mapping. There are two valid
 *     options: 'BY_PART', and 'BY_WHOLE'.
 * @see goog.getCssName for a description.
 */
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style;
};


/**
 * To use CSS renaming in compiled mode, one of the input files should have a
 * call to goog.setCssNameMapping() with an object literal that the JSCompiler
 * can extract and use to replace all calls to goog.getCssName(). In uncompiled
 * mode, JavaScript code should be loaded before this base.js file that declares
 * a global variable, CLOSURE_CSS_NAME_MAPPING, which is used below. This is
 * to ensure that the mapping is loaded before any calls to goog.getCssName()
 * are made in uncompiled mode.
 *
 * A hook for overriding the CSS name mapping.
 * @type {!Object<string, string>|undefined}
 */
goog.global.CLOSURE_CSS_NAME_MAPPING;


if (!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  // This does not call goog.setCssNameMapping() because the JSCompiler
  // requires that goog.setCssNameMapping() be called with an object literal.
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING;
}


/**
 * Gets a localized message.
 *
 * This function is a compiler primitive. If you give the compiler a localized
 * message bundle, it will replace the string at compile-time with a localized
 * version, and expand goog.getMsg call to a concatenated string.
 *
 * Messages must be initialized in the form:
 * <code>
 * var MSG_NAME = goog.getMsg('Hello {$placeholder}', {'placeholder': 'world'});
 * </code>
 *
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object<string, string>=} opt_values Maps place holder name to value.
 * @return {string} message with placeholders filled.
 */
goog.getMsg = function(str, opt_values) {
  if (opt_values) {
    str = str.replace(/\{\$([^}]+)}/g, function(match, key) {
      return key in opt_values ? opt_values[key] : match;
    });
  }
  return str;
};


/**
 * Gets a localized message. If the message does not have a translation, gives a
 * fallback message.
 *
 * This is useful when introducing a new message that has not yet been
 * translated into all languages.
 *
 * This function is a compiler primitive. Must be used in the form:
 * <code>var x = goog.getMsgWithFallback(MSG_A, MSG_B);</code>
 * where MSG_A and MSG_B were initialized with goog.getMsg.
 *
 * @param {string} a The preferred message.
 * @param {string} b The fallback message.
 * @return {string} The best translated message.
 */
goog.getMsgWithFallback = function(a, b) {
  return a;
};


/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated, unless they are
 * exported in turn via this function or goog.exportProperty.
 *
 * Also handy for making public items that are defined in anonymous closures.
 *
 * ex. goog.exportSymbol('public.path.Foo', Foo);
 *
 * ex. goog.exportSymbol('public.path.Foo.staticFunction', Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                       Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param {string} publicPath Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is goog.global.
 */
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};


/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { };
 *
 * function ChildClass(a, b, c) {
 *   ChildClass.base(this, 'constructor', a, b);
 * }
 * goog.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // This works.
 * </pre>
 *
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  /** @override */
  childCtor.prototype.constructor = childCtor;

  /**
   * Calls superclass constructor/method.
   *
   * This function is only available if you use goog.inherits to
   * express inheritance relationships between classes.
   *
   * NOTE: This is a replacement for goog.base and for superClass_
   * property defined in childCtor.
   *
   * @param {!Object} me Should always be "this".
   * @param {string} methodName The method name to call. Calling
   *     superclass constructor can be done with the special string
   *     'constructor'.
   * @param {...*} var_args The arguments to pass to superclass
   *     method/constructor.
   * @return {*} The return value of the superclass method/constructor.
   */
  childCtor.base = function(me, methodName, var_args) {
    // Copying using loop to avoid deop due to passing arguments object to
    // function. This is faster in many JS engines as of late 2014.
    var args = new Array(arguments.length - 2);
    for (var i = 2; i < arguments.length; i++) {
      args[i - 2] = arguments[i];
    }
    return parentCtor.prototype[methodName].apply(me, args);
  };
};


/**
 * Call up to the superclass.
 *
 * If this is called from a constructor, then this calls the superclass
 * constructor with arguments 1-N.
 *
 * If this is called from a prototype method, then you must pass the name of the
 * method as the second argument to this function. If you do not, you will get a
 * runtime error. This calls the superclass' method with arguments 2-N.
 *
 * This function only works if you use goog.inherits to express inheritance
 * relationships between your classes.
 *
 * This function is a compiler primitive. At compile-time, the compiler will do
 * macro expansion to remove a lot of the extra overhead that this function
 * introduces. The compiler will also enforce a lot of the assumptions that this
 * function makes, and treat it as a compiler error if you break them.
 *
 * @param {!Object} me Should always be "this".
 * @param {*=} opt_methodName The method name if calling a super method.
 * @param {...*} var_args The rest of the arguments.
 * @return {*} The return value of the superclass method.
 * @suppress {es5Strict} This method can not be used in strict mode, but
 *     all Closure Library consumers must depend on this file.
 */
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;

  if (goog.STRICT_MODE_COMPATIBLE || (goog.DEBUG && !caller)) {
    throw Error('arguments.caller not defined.  goog.base() cannot be used ' +
                'with strict mode code. See ' +
                'http://www.ecma-international.org/ecma-262/5.1/#sec-C');
  }

  if (caller.superClass_) {
    // Copying using loop to avoid deop due to passing arguments object to
    // function. This is faster in many JS engines as of late 2014.
    var ctorArgs = new Array(arguments.length - 1);
    for (var i = 1; i < arguments.length; i++) {
      ctorArgs[i - 1] = arguments[i];
    }
    // This is a constructor. Call the superclass constructor.
    return caller.superClass_.constructor.apply(me, ctorArgs);
  }

  // Copying using loop to avoid deop due to passing arguments object to
  // function. This is faster in many JS engines as of late 2014.
  var args = new Array(arguments.length - 2);
  for (var i = 2; i < arguments.length; i++) {
    args[i - 2] = arguments[i];
  }
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }

  // If we did not find the caller in the prototype chain, then one of two
  // things happened:
  // 1) The caller is an instance method.
  // 2) This method was not called by the right caller.
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
        'goog.base called from a method of one name ' +
        'to a method of a different name');
  }
};


/**
 * Allow for aliasing within scope functions.  This function exists for
 * uncompiled code - in compiled code the calls will be inlined and the aliases
 * applied.  In uncompiled code the function is simply run since the aliases as
 * written are valid JavaScript.
 *
 *
 * @param {function()} fn Function to call.  This function can contain aliases
 *     to namespaces (e.g. "var dom = goog.dom") or classes
 *     (e.g. "var Timer = goog.Timer").
 */
goog.scope = function(fn) {
  fn.call(goog.global);
};


/*
 * To support uncompiled, strict mode bundles that use eval to divide source
 * like so:
 *    eval('someSource;//# sourceUrl sourcefile.js');
 * We need to export the globally defined symbols "goog" and "COMPILED".
 * Exporting "goog" breaks the compiler optimizations, so we required that
 * be defined externally.
 * NOTE: We don't use goog.exportSymbol here because we don't want to trigger
 * extern generation when that compiler option is enabled.
 */
if (!COMPILED) {
  goog.global['COMPILED'] = COMPILED;
}



//==============================================================================
// goog.defineClass implementation
//==============================================================================


/**
 * Creates a restricted form of a Closure "class":
 *   - from the compiler's perspective, the instance returned from the
 *     constructor is sealed (no new properties may be added).  This enables
 *     better checks.
 *   - the compiler will rewrite this definition to a form that is optimal
 *     for type checking and optimization (initially this will be a more
 *     traditional form).
 *
 * @param {Function} superClass The superclass, Object or null.
 * @param {goog.defineClass.ClassDescriptor} def
 *     An object literal describing
 *     the class.  It may have the following properties:
 *     "constructor": the constructor function
 *     "statics": an object literal containing methods to add to the constructor
 *        as "static" methods or a function that will receive the constructor
 *        function as its only parameter to which static properties can
 *        be added.
 *     all other properties are added to the prototype.
 * @return {!Function} The class constructor.
 */
goog.defineClass = function(superClass, def) {
  // TODO(johnlenz): consider making the superClass an optional parameter.
  var constructor = def.constructor;
  var statics = def.statics;
  // Wrap the constructor prior to setting up the prototype and static methods.
  if (!constructor || constructor == Object.prototype.constructor) {
    constructor = function() {
      throw Error('cannot instantiate an interface (no constructor defined).');
    };
  }

  var cls = goog.defineClass.createSealingConstructor_(constructor, superClass);
  if (superClass) {
    goog.inherits(cls, superClass);
  }

  // Remove all the properties that should not be copied to the prototype.
  delete def.constructor;
  delete def.statics;

  goog.defineClass.applyProperties_(cls.prototype, def);
  if (statics != null) {
    if (statics instanceof Function) {
      statics(cls);
    } else {
      goog.defineClass.applyProperties_(cls, statics);
    }
  }

  return cls;
};


/**
 * @typedef {
 *     !Object|
 *     {constructor:!Function}|
 *     {constructor:!Function, statics:(Object|function(Function):void)}}
 * @suppress {missingProvide}
 */
goog.defineClass.ClassDescriptor;


/**
 * @define {boolean} Whether the instances returned by
 * goog.defineClass should be sealed when possible.
 */
goog.define('goog.defineClass.SEAL_CLASS_INSTANCES', goog.DEBUG);


/**
 * If goog.defineClass.SEAL_CLASS_INSTANCES is enabled and Object.seal is
 * defined, this function will wrap the constructor in a function that seals the
 * results of the provided constructor function.
 *
 * @param {!Function} ctr The constructor whose results maybe be sealed.
 * @param {Function} superClass The superclass constructor.
 * @return {!Function} The replacement constructor.
 * @private
 */
goog.defineClass.createSealingConstructor_ = function(ctr, superClass) {
  if (goog.defineClass.SEAL_CLASS_INSTANCES &&
      Object.seal instanceof Function) {
    // Don't seal subclasses of unsealable-tagged legacy classes.
    if (superClass && superClass.prototype &&
        superClass.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_]) {
      return ctr;
    }
    /**
     * @this {Object}
     * @return {?}
     */
    var wrappedCtr = function() {
      // Don't seal an instance of a subclass when it calls the constructor of
      // its super class as there is most likely still setup to do.
      var instance = ctr.apply(this, arguments) || this;
      instance[goog.UID_PROPERTY_] = instance[goog.UID_PROPERTY_];
      if (this.constructor === wrappedCtr) {
        Object.seal(instance);
      }
      return instance;
    };
    return wrappedCtr;
  }
  return ctr;
};


// TODO(johnlenz): share these values with the goog.object
/**
 * The names of the fields that are defined on Object.prototype.
 * @type {!Array<string>}
 * @private
 * @const
 */
goog.defineClass.OBJECT_PROTOTYPE_FIELDS_ = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];


// TODO(johnlenz): share this function with the goog.object
/**
 * @param {!Object} target The object to add properties to.
 * @param {!Object} source The object to copy properties from.
 * @private
 */
goog.defineClass.applyProperties_ = function(target, source) {
  // TODO(johnlenz): update this to support ES5 getters/setters

  var key;
  for (key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }

  // For IE the for-in-loop does not contain any properties that are not
  // enumerable on the prototype object (for example isPrototypeOf from
  // Object.prototype) and it will also not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
  for (var i = 0; i < goog.defineClass.OBJECT_PROTOTYPE_FIELDS_.length; i++) {
    key = goog.defineClass.OBJECT_PROTOTYPE_FIELDS_[i];
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }
};


/**
 * Sealing classes breaks the older idiom of assigning properties on the
 * prototype rather than in the constructor.  As such, goog.defineClass
 * must not seal subclasses of these old-style classes until they are fixed.
 * Until then, this marks a class as "broken", instructing defineClass
 * not to seal subclasses.
 * @param {!Function} ctr The legacy constructor to tag as unsealable.
 */
goog.tagUnsealableClass = function(ctr) {
  if (!COMPILED && goog.defineClass.SEAL_CLASS_INSTANCES) {
    ctr.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_] = true;
  }
};


/**
 * Name for unsealable tag property.
 * @const @private {string}
 */
goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_ = 'goog_defineClass_legacy_unsealable';
goog.provide('atlas');
goog.provide('atlas.Data');
goog.provide('atlas.Page');
goog.provide('atlas.Site');

/**
 * @constructor
 */
atlas.Page = function ()
{
	var page = this;
	page.name = "";
	page.w = 0;
	page.h = 0;
	page.format = "RGBA8888";
	page.min_filter = "linear";
	page.mag_filter = "linear";
	page.wrap_s = "clamp-to-edge";
	page.wrap_t = "clamp-to-edge";
}

/**
 * @constructor
 */
atlas.Site = function ()
{
	var site = this;
	site.page = null;
	site.x = 0;
	site.y = 0;
	site.w = 0;
	site.h = 0;
	site.rotate = 0;
	site.offset_x = 0;
	site.offset_y = 0;
	site.original_w = 0;
	site.original_h = 0;
	site.index = -1;
}

/**
 * @constructor
 */
atlas.Data = function ()
{
	var data = this;
	data.pages = [];
	data.sites = {};
}

/**
 * @return {atlas.Data}
 */
atlas.Data.prototype.drop = function ()
{
	var data = this;
	data.pages = [];
	data.sites = {};
	return data;
}

/**
 * @return {atlas.Data}
 * @param {string} text
 */
atlas.Data.prototype.import = function (text)
{
	return this.importAtlasText(text);
}

/**
 * @return {string}
 * @param {string=} text
 */
atlas.Data.prototype.export = function (text)
{
	return this.exportAtlasText(text);
}

/**
 * @return {atlas.Data}
 * @param {string} text
 */
atlas.Data.prototype.importAtlasText = function (text)
{
	var lines = text.split(/\n|\r\n/);
	return this.importAtlasTextLines(lines);
}

/**
 * @return {string}
 * @param {string=} text
 */
atlas.Data.prototype.exportAtlasText = function (text)
{
	var lines = this.exportAtlasTextLines([])
	return (text || "") + lines.join('\n');
}

/**
 * @return {atlas.Data}
 * @param {Array.<string>} lines
 */
atlas.Data.prototype.importAtlasTextLines = function (lines)
{
	var data = this;

	data.pages = [];
	data.sites = {};

	function trim (s) { return s.replace(/^\s+|\s+$/g, ""); }

	var page = null;
	var site = null;

	var match = null;

	lines.forEach(function (line)
	{
		if (trim(line).length === 0)
		{
			page = null;
			site = null;
		}
		else if (match = line.match(/^size: (.*),(.*)$/))
		{
			page.w = parseInt(match[1], 10);
			page.h = parseInt(match[2], 10);
		}
		else if (match = line.match(/^format: (.*)$/))
		{
			page.format = match[1];
		}
		else if (match = line.match(/^filter: (.*),(.*)$/))
		{
			page.min_filter = match[1];
			page.mag_filter = match[2];
		}
		else if (match = line.match(/^repeat: (.*)$/))
		{
			var repeat = match[1];
			page.wrap_s = ((repeat === 'x') || (repeat === 'xy'))?('Repeat'):('ClampToEdge');
			page.wrap_t = ((repeat === 'y') || (repeat === 'xy'))?('Repeat'):('ClampToEdge');
		}
		else if (match = line.match(/^orig: (.*)[,| x] (.*)$/))
		{
			var original_w = parseInt(match[1], 10);
			var original_h = parseInt(match[2], 10);
			console.log("page:orig", original_w, original_h);
		}
		else if (page === null)
		{
			page = new atlas.Page();
			page.name = line;
			data.pages.push(page);
		}
		else
		{
			if (match = line.match(/^  rotate: (.*)$/))
			{
				site.rotate = (match[1] !== 'false')?(-1):(0); // -90 degrees
			}
			else if (match = line.match(/^  xy: (.*), (.*)$/))
			{
				site.x = parseInt(match[1], 10);
				site.y = parseInt(match[2], 10);
			}
			else if (match = line.match(/^  size: (.*), (.*)$/))
			{
				site.w = parseInt(match[1], 10);
				site.h = parseInt(match[2], 10);
			}
			else if (match = line.match(/^  orig: (.*), (.*)$/))
			{
				site.original_w = parseInt(match[1], 10);
				site.original_h = parseInt(match[2], 10);
			}
			else if (match = line.match(/^  offset: (.*), (.*)$/))
			{
				site.offset_x = parseInt(match[1], 10);
				site.offset_y = parseInt(match[2], 10);
			}
			else if (match = line.match(/^  index: (.*)$/))
			{
				site.index = parseInt(match[1], 10);
			}
			else
			{
				if (site)
				{
					site.original_w = site.original_w || site.w;
					site.original_h = site.original_h || site.h;
				}

				site = new atlas.Site();
				site.page = page;
				data.sites[line] = site;
			}
		}
	});

	return data;
}

/**
 * @return {string}
 * @param {Array.<string>=} lines
 */
atlas.Data.prototype.exportAtlasTextLines = function (lines)
{
	lines = lines || [];

	var data = this;

	data.pages.forEach(function (page)
	{
		lines.push(""); // empty line denotes new page
		lines.push(page.name);
		lines.push("size: " + page.w + "," + page.h);
		lines.push("format: " + page.format);
		lines.push("filter: " + page.min_filter + "," + page.mag_filter);
		var repeat = 'none';
		if ((page.wrap_s === 'Repeat') && (page.wrap_t === 'Repeat')) { repeat = 'xy'; }
		else if (page.wrap_s === 'Repeat') { repeat = 'x'; }
		else if (page.wrap_t === 'Repeat') { repeat = 'y'; }
		lines.push("repeat: " + repeat);

		for (var site_key in data.sites)
		{
			var site = data.sites[site_key];
			if (site.page !== page) { continue; }
			lines.push(site_key);
			lines.push("  rotate: " + (site.rotate !== 0?'true':'false'));
			lines.push("  xy: " + site.x + ", " + site.y);
			lines.push("  size: " + site.w + ", " + site.h);
			lines.push("  orig: " + site.original_w + ", " + site.original_h);
			lines.push("  offset: " + site.offset_x + ", " + site.offset_y);
			lines.push("  index: " + site.index);
		}
	});

	return lines;
}

/**
 * @return {atlas.Data}
 * @param {string} tps_text
 */
atlas.Data.prototype.importTpsText = function (tps_text)
{
	var data = this;

	data.pages = [];
	data.sites = {};

	return data.importTpsTextPage(tps_text, 0);
}

/**
 * @return {atlas.Data}
 * @param {string} tps_text
 * @param {number=} page_index
 */
atlas.Data.prototype.importTpsTextPage = function (tps_text, page_index)
{
	var data = this;

	page_index = page_index || 0;

	var tps_json = JSON.parse(tps_text);

	if (tps_json.meta)
	{
		// TexturePacker only supports one page
		var page = data.pages[page_index] = new atlas.Page();
		page.w = tps_json.meta.size.w;
		page.h = tps_json.meta.size.h;
		page.name = tps_json.meta.image;
	}

	if (tps_json.frames) for (var i in tps_json.frames)
	{
		var frame = tps_json.frames[i];
		var site = data.sites[i] = new atlas.Site();
		site.page = page_index;
		site.x = frame.frame.x;
		site.y = frame.frame.y;
		site.w = frame.frame.w;
		site.h = frame.frame.h;
		site.rotate = (frame.rotated)?(1):(0); // 90 degrees
		site.offset_x = (frame.spriteSourceSize && frame.spriteSourceSize.x) || 0;
		site.offset_y = (frame.spriteSourceSize && frame.spriteSourceSize.y) || 0;
		site.original_w = (frame.sourceSize && frame.sourceSize.w) || site.w;
		site.original_h = (frame.sourceSize && frame.sourceSize.h) || site.h;
	}

	return data;
}
/**
 * Copyright (c) 2015 Flyover Games, LLC 
 *  
 * Jason Andersen jgandersen@gmail.com 
 * Isaac Burns isaacburns@gmail.com 
 * 
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 * 
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 * 
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgement in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 */

/**
 * A JavaScript API for the Spriter SCML animation data format.
 */
goog.provide('spriter');

/**
 * @return {boolean} 
 * @param {Object.<string,?>|Array.<?>} json 
 * @param {string|number} key 
 * @param {boolean=} def 
 */
spriter.loadBool = function (json, key, def)
{
	var value = json[key];
	switch (typeof(value))
	{
	case 'string': return (value === 'true') ? true : false;
	case 'boolean': return value;
	default: return def || false;
	}
}

/**
 * @return {void} 
 * @param {Object.<string,?>|Array.<?>} json 
 * @param {string|number} key 
 * @param {boolean} value 
 * @param {boolean=} def 
 */
spriter.saveBool = function (json, key, value, def)
{
	if ((typeof(def) !== 'boolean') || (value !== def))
	{
		json[key] = value;
	}
}

/**
 * @return {number} 
 * @param {Object.<string,?>|Array.<?>} json 
 * @param {string|number} key 
 * @param {number=} def 
 */
spriter.loadFloat = function (json, key, def)
{
	var value = json[key];
	switch (typeof(value))
	{
	case 'string': return parseFloat(value);
	case 'number': return value;
	default: return def || 0.0;
	}
}

/**
 * @return {void} 
 * @param {Object.<string,?>|Array.<?>} json 
 * @param {string|number} key 
 * @param {number} value 
 * @param {number=} def 
 */
spriter.saveFloat = function (json, key, value, def)
{
	if ((typeof(def) !== 'number') || (value !== def))
	{
		json[key] = value;
	}
}

/**
 * @return {number} 
 * @param {Object.<string,?>|Array.<?>} json 
 * @param {string|number} key 
 * @param {number=} def 
 */
spriter.loadInt = function (json, key, def)
{
	var value = json[key];
	switch (typeof(value))
	{
	case 'string': return parseInt(value, 10);
	case 'number': return 0 | value;
	default: return def || 0;
	}
}

/**
 * @return {void} 
 * @param {Object.<string,?>|Array.<?>} json 
 * @param {string|number} key 
 * @param {number} value 
 * @param {number=} def 
 */
spriter.saveInt = function (json, key, value, def)
{
	if ((typeof(def) !== 'number') || (value !== def))
	{
		json[key] = value;
	}
}

/**
 * @return {string} 
 * @param {Object.<string,?>|Array.<?>} json 
 * @param {string|number} key 
 * @param {string=} def 
 */
spriter.loadString = function (json, key, def)
{
	var value = json[key];
	switch (typeof(value))
	{
	case 'string': return value;
	default: return def || "";
	}
}

/**
 * @return {void} 
 * @param {Object.<string,?>|Array.<?>} json 
 * @param {string|number} key 
 * @param {string} value 
 * @param {string=} def 
 */
spriter.saveString = function (json, key, value, def)
{
	if ((typeof(def) !== 'string') || (value !== def))
	{
		json[key] = value;
	}
}

/**
 * @return {Array}
 * @param {*} value 
 */
spriter.makeArray = function (value)
{
	if ((typeof(value) === 'object') && (typeof(value.length) === 'number')) // (Object.isArray(value))
	{
		return /** @type {Array} */ (value);
	}
	if (typeof(value) !== 'undefined')
	{
		return [ value ];
	}
	return [];
}

/**
 * @return {number} 
 * @param {number} num 
 * @param {number} min 
 * @param {number} max 
 */
spriter.wrap = function (num, min, max)
{
	if (min < max)
	{
		if (num < min)
		{
			return max - ((min - num) % (max - min));
		}
		else
		{
			return min + ((num - min) % (max - min));
		}
	}
	else if (min === max)
	{
		return min;
	}
	else
	{
		return num;
	}
}

/**
 * @return {number}
 * @param {number} a
 * @param {number} b
 * @param {number} t
 */
spriter.interpolateLinear = function (a, b, t)
{
	return a + ((b - a) * t);
}

/**
 * @return {number}
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} t
 */
spriter.interpolateQuadratic = function (a, b, c, t)
{
	return spriter.interpolateLinear(spriter.interpolateLinear(a,b,t),spriter.interpolateLinear(b,c,t),t);
}

/**
 * @return {number}
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @param {number} t
 */
spriter.interpolateCubic = function (a, b, c, d, t)
{
	return spriter.interpolateLinear(spriter.interpolateQuadratic(a,b,c,t),spriter.interpolateQuadratic(b,c,d,t),t);
}

/**
 * @return {number}
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @param {number} e
 * @param {number} t
 */
spriter.interpolateQuartic = function (a, b, c, d, e, t)
{
	return spriter.interpolateLinear(spriter.interpolateCubic(a,b,c,d,t),spriter.interpolateCubic(b,c,d,e,t),t);
}

/**
 * @return {number}
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @param {number} e
 * @param {number} f
 * @param {number} t
 */
spriter.interpolateQuintic = function (a, b, c, d, e, f, t)
{
	return spriter.interpolateLinear(spriter.interpolateQuartic(a,b,c,d,e,t),spriter.interpolateQuartic(b,c,d,e,f,t),t);
}

/**
 * @return {number}
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} t
 */
spriter.interpolateBezier = function (x1, y1, x2, y2, t)
{
	function SampleCurve(a, b, c, t)
	{
		return ((a * t + b) * t + c) * t;
	}

	function SampleCurveDerivativeX(ax, bx, cx, t)
	{
		return (3.0 * ax * t + 2.0 * bx) * t + cx;
	}

	function SolveEpsilon(duration)
	{
		return 1.0 / (200.0 * duration);
	}

	function Solve(ax, bx, cx, ay, by, cy, x, epsilon)
	{
		return SampleCurve(ay, by, cy, SolveCurveX(ax, bx, cx, x, epsilon));
	}

	function SolveCurveX(ax, bx, cx, x, epsilon)
	{
		var t0;
		var t1;
		var t2;
		var x2;
		var d2;
		var i;

		// First try a few iterations of Newton's method -- normally very fast.
		for (t2 = x, i = 0; i < 8; i++)
		{
			x2 = SampleCurve(ax, bx, cx, t2) - x;
			if (Math.abs(x2) < epsilon) return t2;

			d2 = SampleCurveDerivativeX(ax, bx, cx, t2);
			if (Math.abs(d2) < epsilon) break;

			t2 = t2 - x2 / d2;
		}

		// Fall back to the bisection method for reliability.
		t0 = 0.0;
		t1 = 1.0;
		t2 = x;

		if (t2 < t0) return t0;
		if (t2 > t1) return t1;

		while (t0 < t1)
		{
			x2 = SampleCurve(ax, bx, cx, t2);
			if (Math.abs(x2 - x) < epsilon) return t2;
			if (x > x2) t0 = t2;
			else t1 = t2;
			t2 = (t1 - t0) * 0.5 + t0;
		}

		return t2; // Failure.
	}

	var duration = 1;
	var cx = 3.0 * x1;
	var bx = 3.0 * (x2 - x1) - cx;
	var ax = 1.0 - cx - bx;
	var cy = 3.0 * y1;
	var by = 3.0 * (y2 - y1) - cy;
	var ay = 1.0 - cy - by;

	return Solve(ax, bx, cx, ay, by, cy, t, SolveEpsilon(duration));
}

/**
 * @return {number}
 * @param {number} a
 * @param {number} b
 * @param {number} t
 */
spriter.tween = function (a, b, t)
{
	return a + ((b - a) * t);
}

/**
 * @return {number} 
 * @param {number} angle 
 */
spriter.wrapAngleRadians = function (angle)
{
	if (angle <= 0.0)
	{
		return ((angle - Math.PI) % (2.0*Math.PI)) + Math.PI;
	}
	else
	{
		return ((angle + Math.PI) % (2.0*Math.PI)) - Math.PI;
	}
}

/**
 * @return {number}
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @param {number} spin
 */
spriter.tweenAngleRadians = function (a, b, t, spin)
{
	if (spin === 0)
	{
		return a;
	}
	else if (spin > 0)
	{
		if ((b - a) < 0.0)
		{
			b += 2.0*Math.PI;
		}
	}
	else if (spin < 0)
	{
		if ((b - a) > 0.0)
		{
			b -= 2.0*Math.PI;
		}
	}

	return spriter.wrapAngleRadians(a + (spriter.wrapAngleRadians(b - a) * t));
}

/**
 * @constructor 
 * @param {number=} rad 
 */
spriter.Angle = function (rad)
{
	this.rad = rad || 0.0;
}

Object.defineProperty(spriter.Angle.prototype, 'deg', 
{
	/** @this {spriter.Angle} */
	get: function () { return this.rad * 180 / Math.PI; },
	/** @this {spriter.Angle} */
	set: function (value) { this.rad = value * Math.PI / 180; }
});

Object.defineProperty(spriter.Angle.prototype, 'cos', 
{
	/** @this {spriter.Angle} */
	get: function () { return Math.cos(this.rad); }
});

Object.defineProperty(spriter.Angle.prototype, 'sin', 
{
	/** @this {spriter.Angle} */
	get: function () { return Math.sin(this.rad); }
});

/**
 * @return {spriter.Angle}
 */
spriter.Angle.prototype.selfIdentity = function ()
{
	this.rad = 0.0;
	return this;
}

/**
 * @return {spriter.Angle}
 * @param {spriter.Angle} other 
 */
spriter.Angle.prototype.copy = function (other)
{
	this.rad = other.rad;
	return this;
}

/**
 * @return {spriter.Angle}
 * @param {spriter.Angle} a 
 * @param {spriter.Angle} b 
 * @param {spriter.Angle=} out 
 */
spriter.Angle.add = function (a, b, out)
{
	out = out || new spriter.Angle();
	out.rad = spine.wrapAngleRadians(a.rad + b.rad);
	return out;
}

/**
 * @return {spriter.Angle}
 * @param {spriter.Angle} other 
 * @param {spriter.Angle=} out 
 */
spriter.Angle.prototype.add = function (other, out)
{
	return spriter.Angle.add(this, other, out);
}

/**
 * @return {spriter.Angle}
 * @param {spriter.Angle} other 
 */
spriter.Angle.prototype.selfAdd = function (other)
{
	return spriter.Angle.add(this, other, this);
}

/**
 * @return {spriter.Angle}
 * @param {spriter.Angle} a 
 * @param {spriter.Angle} b 
 * @param {number} pct 
 * @param {number} spin 
 * @param {spriter.Angle=} out 
 */
spriter.Angle.tween = function (a, b, pct, spin, out)
{
	out = out || new spriter.Angle();
	out.rad = spriter.tweenAngleRadians(a.rad, b.rad, pct, spin);
	return out;
}

/**
 * @return {spriter.Angle}
 * @param {spriter.Angle} other 
 * @param {number} pct 
 * @param {number} spin 
 * @param {spriter.Angle=} out 
 */
spriter.Angle.prototype.tween = function (other, pct, spin, out)
{
	return spriter.Angle.tween(this, other, pct, spin, out);
}

/**
 * @return {spriter.Angle}
 * @param {spriter.Angle} other 
 * @param {number} pct 
 * @param {number} spin 
 */
spriter.Angle.prototype.selfTween = function (other, pct, spin)
{
	return spriter.Angle.tween(this, other, pct, spin, this);
}

/**
 * @constructor 
 * @param {number=} x 
 * @param {number=} y 
 */
spriter.Vector = function (x, y)
{
	this.x = x || 0.0;
	this.y = y || 0.0;
}

/** @type {number} */
spriter.Vector.prototype.x = 0.0;
/** @type {number} */
spriter.Vector.prototype.y = 0.0;

/**
 * @return {spriter.Vector}
 * @param {spriter.Vector} other 
 */
spriter.Vector.prototype.copy = function (other)
{
	this.x = other.x;
	this.y = other.y;
	return this;
}

/**
 * @return {spriter.Vector}
 * @param {spriter.Vector} a 
 * @param {spriter.Vector} b 
 * @param {spriter.Vector=} out 
 */
spriter.Vector.add = function (a, b, out)
{
	out = out || new spriter.Vector();
	out.x = a.x + b.x;
	out.y = a.y + b.y;
	return out;
}

/**
 * @return {spriter.Vector}
 * @param {spriter.Vector} other 
 * @param {spriter.Vector=} out 
 */
spriter.Vector.prototype.add = function (other, out)
{
	return spriter.Vector.add(this, other, out);
}

/**
 * @return {spriter.Vector}
 * @param {spriter.Vector} other 
 */
spriter.Vector.prototype.selfAdd = function (other)
{
	//return spriter.Vector.add(this, other, this);
	this.x += other.x;
	this.y += other.y;
	return this;
}

/**
 * @return {spriter.Vector}
 * @param {spriter.Vector} a 
 * @param {spriter.Vector} b 
 * @param {number} pct 
 * @param {spriter.Vector=} out 
 */
spriter.Vector.tween = function (a, b, pct, out)
{
	out = out || new spriter.Vector();
	out.x = spriter.tween(a.x, b.x, pct);
	out.y = spriter.tween(a.y, b.y, pct);
	return out;
}

/**
 * @return {spriter.Vector}
 * @param {spriter.Vector} other 
 * @param {number} pct 
 * @param {spriter.Vector=} out 
 */
spriter.Vector.prototype.tween = function (other, pct, out)
{
	return spriter.Vector.tween(this, other, pct, out);
}

/**
 * @return {spriter.Vector}
 * @param {spriter.Vector} other 
 * @param {number} pct 
 */
spriter.Vector.prototype.selfTween = function (other, pct)
{
	return spriter.Vector.tween(this, other, pct, this);
}

/**
 * @constructor 
 * @extends {spriter.Vector} 
 */
spriter.Position = function ()
{
	goog.base(this, 0.0, 0.0);
}

goog.inherits(spriter.Position, spriter.Vector);

/**
 * @constructor 
 * @extends {spriter.Angle} 
 */
spriter.Rotation = function ()
{
	goog.base(this, 0.0);
}

goog.inherits(spriter.Rotation, spriter.Angle);

/**
 * @constructor 
 * @extends {spriter.Vector} 
 */
spriter.Scale = function ()
{
	goog.base(this, 1.0, 1.0);
}

goog.inherits(spriter.Scale, spriter.Vector);

/**
 * @return {spriter.Scale}
 */
spriter.Scale.prototype.selfIdentity = function ()
{
	this.x = 1.0;
	this.y = 1.0;
	return this;
}

/**
 * @constructor 
 * @extends {spriter.Vector} 
 */
spriter.Pivot = function ()
{
	goog.base(this, 0.0, 1.0);
}

goog.inherits(spriter.Pivot, spriter.Vector);

/**
 * @return {spriter.Pivot}
 */
spriter.Pivot.prototype.selfIdentity = function ()
{
	this.x = 0.0;
	this.y = 1.0;
	return this;
}

/**
 * @constructor 
 */
spriter.Space = function ()
{
	var space = this;
	space.position = new spriter.Position();
	space.rotation = new spriter.Rotation();
	space.scale = new spriter.Scale();
}

/** @type {spriter.Position} */
spriter.Space.prototype.position;
/** @type {spriter.Rotation} */
spriter.Space.prototype.rotation;
/** @type {spriter.Scale} */
spriter.Space.prototype.scale;

/**
 * @return {spriter.Space} 
 * @param {spriter.Space} other 
 */
spriter.Space.prototype.copy = function (other)
{
	var space = this;
	space.position.copy(other.position);
	space.rotation.copy(other.rotation);
	space.scale.copy(other.scale);
	return space;
}

/**
 * @return {spriter.Space} 
 * @param {Object.<string,?>} json 
 */
spriter.Space.prototype.load = function (json)
{
	var space = this;
	space.position.x = spriter.loadFloat(json, 'x', 0.0);
	space.position.y = spriter.loadFloat(json, 'y', 0.0);
	space.rotation.deg = spriter.loadFloat(json, 'angle', 0.0);
	space.scale.x = spriter.loadFloat(json, 'scale_x', 1.0);
	space.scale.y = spriter.loadFloat(json, 'scale_y', 1.0);
	return space;
}

/**
 * @return {boolean} 
 * @param {spriter.Space} a 
 * @param {spriter.Space} b 
 * @param {number=} epsilon 
 */
spriter.Space.equal = function (a, b, epsilon)
{
	epsilon = epsilon || 1e-6;
	if (Math.abs(a.position.x - b.position.x) > epsilon) { return false; }
	if (Math.abs(a.position.y - b.position.y) > epsilon) { return false; }
	if (Math.abs(a.rotation.rad - b.rotation.rad) > epsilon) { return false; }
	if (Math.abs(a.scale.x - b.scale.x) > epsilon) { return false; }
	if (Math.abs(a.scale.y - b.scale.y) > epsilon) { return false; }
	return true;
}

/**
 * @return {spriter.Space} 
 * @param {spriter.Space=} out 
 */
spriter.Space.identity = function (out)
{
	out = out || new spriter.Space();
	out.position.x = 0.0;
	out.position.y = 0.0;
	out.rotation.rad = 0.0;
	out.scale.x = 1.0;
	out.scale.y = 1.0;
	return out;
}

/**
 * @return {spriter.Space} 
 * @param {spriter.Space} space 
 * @param {number} x 
 * @param {number} y 
 */
spriter.Space.translate = function (space, x, y)
{
	x *= space.scale.x;
	y *= space.scale.y;
	var rad = space.rotation.rad;
	var c = Math.cos(rad);
	var s = Math.sin(rad);
	var tx = c*x - s*y;
	var ty = s*x + c*y;
	space.position.x += tx;
	space.position.y += ty;
	return space;
}

/**
 * @return {spriter.Space} 
 * @param {spriter.Space} space 
 * @param {number} rad 
 */
spriter.Space.rotate = function (space, rad)
{
	space.rotation.rad = spriter.wrapAngleRadians(space.rotation.rad + rad);
	return space;
}

/**
 * @return {spriter.Space} 
 * @param {spriter.Space} space 
 * @param {number} x 
 * @param {number} y 
 */
spriter.Space.scale = function (space, x, y)
{
	space.scale.x *= x;
	space.scale.y *= y;
	return space;
}

/**
 * @return {spriter.Space} 
 * @param {spriter.Space} space 
 * @param {spriter.Space=} out 
 */
spriter.Space.invert = function (space, out)
{
	// invert
	// out.sca = space.sca.inv();
	// out.rot = space.rot.inv();
	// out.pos = space.pos.neg().rotate(space.rot.inv()).mul(space.sca.inv());

	out = out || new spriter.Space();
	var inv_scale_x = 1.0 / space.scale.x;
	var inv_scale_y = 1.0 / space.scale.y;
	var inv_rotation = -space.rotation.rad;
	var inv_x = -space.position.x;
	var inv_y = -space.position.y;
	out.scale.x = inv_scale_x;
	out.scale.y = inv_scale_y;
	out.rotation.rad = inv_rotation;
	var x = inv_x;
	var y = inv_y;
	var rad = inv_rotation;
	var c = Math.cos(rad);
	var s = Math.sin(rad);
	var tx = c*x - s*y;
	var ty = s*x + c*y;
	out.position.x = tx * inv_scale_x;
	out.position.y = ty * inv_scale_y;
	return out;
}

/**
 * @return {spriter.Space} 
 * @param {spriter.Space} a 
 * @param {spriter.Space} b 
 * @param {spriter.Space=} out 
 */
spriter.Space.combine = function (a, b, out)
{
	// combine
	// out.pos = b.pos.mul(a.sca).rotate(a.rot).add(a.pos);
	// out.rot = b.rot.mul(a.rot);
	// out.sca = b.sca.mul(a.sca);

	out = out || new spriter.Space();
	var x = b.position.x * a.scale.x;
	var y = b.position.y * a.scale.y;
	var rad = a.rotation.rad;
	var c = Math.cos(rad);
	var s = Math.sin(rad);
	var tx = c*x - s*y;
	var ty = s*x + c*y;
	out.position.x = tx + a.position.x;
	out.position.y = ty + a.position.y;
	if ((a.scale.x * a.scale.y) < 0.0)
	{
		out.rotation.rad = spriter.wrapAngleRadians(a.rotation.rad - b.rotation.rad);
	}
	else
	{
		out.rotation.rad = spriter.wrapAngleRadians(b.rotation.rad + a.rotation.rad);
	}
	out.scale.x = b.scale.x * a.scale.x;
	out.scale.y = b.scale.y * a.scale.y;
	return out;
}

/**
 * @return {spriter.Space} 
 * @param {spriter.Space} ab 
 * @param {spriter.Space} a 
 * @param {spriter.Space=} out 
 */
spriter.Space.extract = function (ab, a, out)
{
	// extract
	// out.sca = ab.sca.mul(a.sca.inv());
	// out.rot = ab.rot.mul(a.rot.inv());
	// out.pos = ab.pos.add(a.pos.neg()).rotate(a.rot.inv()).mul(a.sca.inv());

	out = out || new spriter.Space();
	out.scale.x = ab.scale.x / a.scale.x;
	out.scale.y = ab.scale.y / a.scale.y;
	if ((a.scale.x * a.scale.y) < 0.0)
	{
		out.rotation.rad = spriter.wrapAngleRadians(a.rotation.rad + ab.rotation.rad);
	}
	else
	{
		out.rotation.rad = spriter.wrapAngleRadians(ab.rotation.rad - a.rotation.rad);
	}
	var x = ab.position.x - a.position.x;
	var y = ab.position.y - a.position.y;
	var rad = -a.rotation.rad;
	var c = Math.cos(rad);
	var s = Math.sin(rad);
	var tx = c*x - s*y;
	var ty = s*x + c*y;
	out.position.x = tx / a.scale.x;
	out.position.y = ty / a.scale.y;
	return out;
}

/**
 * @return {spriter.Vector} 
 * @param {spriter.Space} space 
 * @param {spriter.Vector} v 
 * @param {spriter.Vector=} out 
 */
spriter.Space.transform = function (space, v, out)
{
	out = out || new spriter.Vector();
	var x = v.x * space.scale.x;
	var y = v.y * space.scale.y;
	var rad = space.rotation.rad;
	var c = Math.cos(rad);
	var s = Math.sin(rad);
	var tx = c*x - s*y;
	var ty = s*x + c*y;
	out.x = tx + space.position.x;
	out.y = ty + space.position.y;
	return out;
}

/**
 * @return {spriter.Vector} 
 * @param {spriter.Space} space 
 * @param {spriter.Vector} v 
 * @param {spriter.Vector=} out 
 */
spriter.Space.untransform = function (space, v, out)
{
	out = out || new spriter.Vector();
	var x = v.x - space.position.x;
	var y = v.y - space.position.y;
	var rad = -space.rotation.rad;
	var c = Math.cos(rad);
	var s = Math.sin(rad);
	var tx = c*x - s*y;
	var ty = s*x + c*y;
	out.x = tx / space.scale.x;
	out.y = ty / space.scale.y;
	return out;
}

/**
 * @return {spriter.Space} 
 * @param {spriter.Space} a 
 * @param {spriter.Space} b 
 * @param {number} tween
 * @param {number} spin
 * @param {spriter.Space=} out 
 */
spriter.Space.tween = function (a, b, tween, spin, out)
{
	out.position.x = spriter.tween(a.position.x, b.position.x, tween);
	out.position.y = spriter.tween(a.position.y, b.position.y, tween);
	out.rotation.rad = spriter.tweenAngleRadians(a.rotation.rad, b.rotation.rad, tween, spin);
	out.scale.x = spriter.tween(a.scale.x, b.scale.x, tween);
	out.scale.y = spriter.tween(a.scale.y, b.scale.y, tween);
	return out;
}

/**
 * @constructor
 */
spriter.Element = function ()
{
}

/** @type {number} */
spriter.Element.prototype.id = -1;
/** @type {string} */
spriter.Element.prototype.name = "";

/**
 * @return {spriter.Element} 
 * @param {Object.<string,?>} json 
 */
spriter.Element.prototype.load = function (json)
{
	this.id = spriter.loadInt(json, 'id', -1);
	this.name = spriter.loadString(json, 'name', "");
	return this;
}

/**
 * @constructor
 * @extends {spriter.Element}
 * @param {string} type
 */
spriter.File = function (type)
{
	goog.base(this);
	this.type = type;
}

goog.inherits(spriter.File, spriter.Element);

/** @type {string} */
spriter.File.prototype.type = "unknown";

/**
 * @return {spriter.File} 
 * @param {Object.<string,?>} json 
 */
spriter.File.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	//var type = spriter.loadString(json, 'type', "image");
	//if (this.type !== type) throw new Error();
	return this;
}

/**
 * @constructor
 * @extends {spriter.File}
 */
spriter.ImageFile = function ()
{
	var file = this;
	goog.base(this, 'image');
	file.pivot = new spriter.Pivot();
}

goog.inherits(spriter.ImageFile, spriter.File);

/** @type {number} */
spriter.ImageFile.prototype.width = 0;
/** @type {number} */
spriter.ImageFile.prototype.height = 0;
/** @type {spriter.Pivot} */
spriter.ImageFile.prototype.pivot;

/**
 * @return {spriter.ImageFile} 
 * @param {Object.<string,?>} json 
 */
spriter.ImageFile.prototype.load = function (json)
{
	var file = this;
	goog.base(this, 'load', json);
	file.width = spriter.loadInt(json, 'width', 0);
	file.height = spriter.loadInt(json, 'height', 0);
	file.pivot.x = spriter.loadFloat(json, 'pivot_x', 0.0);
	file.pivot.y = spriter.loadFloat(json, 'pivot_y', 1.0);
	return file;
}

/**
 * @constructor
 * @extends {spriter.File}
 */
spriter.SoundFile = function ()
{
	goog.base(this, 'sound');
}

goog.inherits(spriter.SoundFile, spriter.File);

/**
 * @return {spriter.File} 
 * @param {Object.<string,?>} json 
 */
spriter.SoundFile.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	return this;
}

/**
 * @constructor
 * @extends {spriter.Element}
 */
spriter.Folder = function ()
{
	var folder = this;
	goog.base(this);
	folder.file_array = [];
}

goog.inherits(spriter.Folder, spriter.Element);

/** @type {Array.<spriter.File>} */
spriter.Folder.prototype.file_array;

/**
 * @return {spriter.Folder} 
 * @param {Object.<string,?>} json 
 */
spriter.Folder.prototype.load = function (json)
{
	var folder = this;
	goog.base(this, 'load', json);
	folder.file_array = [];
	json.file = spriter.makeArray(json.file);
	json.file.forEach(function (file_json)
	{
		switch (file_json.type)
		{
		case 'image':
		default:
			folder.file_array.push(new spriter.ImageFile().load(file_json));
			break;
		case 'sound':
			folder.file_array.push(new spriter.SoundFile().load(file_json));
			break;
		}
	});
	return folder;
}

/**
 * @constructor
 * @param {string} type
 */
spriter.Object = function (type)
{
	this.type = type;
}

/** @type {string} */
spriter.Object.prototype.type = "unknown";
/** @type {string} */
spriter.Object.prototype.name = "";

/**
 * @return {spriter.Object} 
 * @param {Object.<string,?>} json 
 */
spriter.Object.prototype.load = function (json)
{
	//var type = spriter.loadString(json, 'type', "sprite");
	//if (this.type !== type) throw new Error();
	return this;
}

/**
 * @constructor
 * @extends {spriter.Object}
 */
spriter.SpriteObject = function ()
{
	goog.base(this, 'sprite');
	this.local_space = new spriter.Space();
	this.world_space = new spriter.Space();
	this.pivot = new spriter.Pivot();
}

goog.inherits(spriter.SpriteObject, spriter.Object);

/** @type {number} */
spriter.SpriteObject.prototype.parent_index = -1;
/** @type {number} */
spriter.SpriteObject.prototype.folder_index = -1;
/** @type {number} */
spriter.SpriteObject.prototype.file_index = -1;
/** @type {spriter.Space} */
spriter.SpriteObject.prototype.local_space;
/** @type {spriter.Space} */
spriter.SpriteObject.prototype.world_space;
/** @type {boolean} */
spriter.SpriteObject.prototype.default_pivot = false;
/** @type {spriter.Pivot} */
spriter.SpriteObject.prototype.pivot;
/** @type {number} */
spriter.SpriteObject.prototype.z_index = 0;
/** @type {number} */
spriter.SpriteObject.prototype.alpha = 1.0;

/**
 * @return {spriter.SpriteObject} 
 * @param {Object.<string,?>} json 
 */
spriter.SpriteObject.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.parent_index = spriter.loadInt(json, 'parent', -1);
	this.folder_index = spriter.loadInt(json, 'folder', -1);
	this.file_index = spriter.loadInt(json, 'file', -1);
	this.local_space.load(json);
	this.world_space.copy(this.local_space);
	if ((typeof(json['pivot_x']) !== 'undefined') || 
		(typeof(json['pivot_y']) !== 'undefined'))
	{
		this.pivot.x = spriter.loadFloat(json, 'pivot_x', 0.0);
		this.pivot.y = spriter.loadFloat(json, 'pivot_y', 1.0);
	}
	else
	{
		this.default_pivot = true;
	}
	this.z_index = spriter.loadInt(json, 'z_index', 0);
	this.alpha = spriter.loadFloat(json, 'a', 1.0);
	return this;
}

/**
 * @return {spriter.SpriteObject}
 * @param {spriter.SpriteObject} other
 */
spriter.SpriteObject.prototype.copy = function (other)
{
	this.parent_index = other.parent_index;
	this.folder_index = other.folder_index;
	this.file_index = other.file_index;
	this.local_space.copy(other.local_space);
	this.world_space.copy(other.world_space);
	this.default_pivot = other.default_pivot;
	this.pivot.copy(other.pivot);
	this.z_index = other.z_index;
	this.alpha = other.alpha;
	return this;
}

/**
 * @return {void}
 * @param {spriter.SpriteObject} other
 * @param {number} tween
 * @param {number} spin
 */
spriter.SpriteObject.prototype.tween = function (other, tween, spin)
{
	spriter.Space.tween(this.local_space, other.local_space, tween, spin, this.local_space);
	//spriter.Vector.tween(this.pivot, other.pivot, tween, this.pivot);
	this.alpha = spriter.tween(this.alpha, other.alpha, tween);
}

/**
 * @constructor
 * @extends {spriter.Object}
 */
spriter.Bone = function ()
{
	goog.base(this, 'bone');
	this.local_space = new spriter.Space();
	this.world_space = new spriter.Space();
}

goog.inherits(spriter.Bone, spriter.Object);

/** @type {number} */
spriter.Bone.prototype.parent_index = -1;
/** @type {spriter.Space} */
spriter.Bone.prototype.local_space;
/** @type {spriter.Space} */
spriter.Bone.prototype.world_space;

/**
 * @return {spriter.Bone} 
 * @param {Object.<string,?>} json 
 */
spriter.Bone.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.parent_index = spriter.loadInt(json, 'parent', -1);
	this.local_space.load(json);
	this.world_space.copy(this.local_space);
	return this;
}

/**
 * @return {spriter.Bone}
 * @param {spriter.Bone} other
 */
spriter.Bone.prototype.copy = function (other)
{
	this.parent_index = other.parent_index;
	this.local_space.copy(other.local_space);
	this.world_space.copy(other.world_space);
	return this;
}

/**
 * @return {void}
 * @param {spriter.Bone} other
 * @param {number} tween
 * @param {number} spin
 */
spriter.Bone.prototype.tween = function (other, tween, spin)
{
	spriter.Space.tween(this.local_space, other.local_space, tween, spin, this.local_space);
}

/**
 * @constructor
 * @extends {spriter.Object}
 */
spriter.BoxObject = function ()
{
	goog.base(this, 'box');
	this.local_space = new spriter.Space();
	this.world_space = new spriter.Space();
	this.pivot = new spriter.Pivot();
}

goog.inherits(spriter.BoxObject, spriter.Object);

/** @type {number} */
spriter.BoxObject.prototype.parent_index = -1;
/** @type {spriter.Space} */
spriter.BoxObject.prototype.local_space;
/** @type {spriter.Space} */
spriter.BoxObject.prototype.world_space;
/** @type {spriter.Pivot} */
spriter.BoxObject.prototype.pivot;

/**
 * @return {spriter.BoxObject} 
 * @param {Object.<string,?>} json 
 */
spriter.BoxObject.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.parent_index = spriter.loadInt(json, 'parent', -1);
	this.local_space.load(json);
	this.world_space.copy(this.local_space);
	this.pivot.x = spriter.loadFloat(json, 'pivot_x', 0.0);
	this.pivot.y = spriter.loadFloat(json, 'pivot_y', 1.0);
	return this;
}

/**
 * @return {spriter.BoxObject}
 * @param {spriter.BoxObject} other
 */
spriter.BoxObject.prototype.copy = function (other)
{
	this.parent_index = other.parent_index;
	this.local_space.copy(other.local_space);
	this.world_space.copy(other.world_space);
	this.pivot.copy(other.pivot);
	return this;
}

/**
 * @return {void}
 * @param {spriter.BoxObject} other
 * @param {number} tween
 * @param {number} spin
 */
spriter.BoxObject.prototype.tween = function (other, tween, spin)
{
	spriter.Space.tween(this.local_space, other.local_space, tween, spin, this.local_space);
	//spriter.Vector.tween(this.pivot, other.pivot, tween, this.pivot);
}

/**
 * @constructor
 * @extends {spriter.Object}
 */
spriter.PointObject = function ()
{
	goog.base(this, 'point');
	this.local_space = new spriter.Space();
	this.world_space = new spriter.Space();
}

goog.inherits(spriter.PointObject, spriter.Object);

/** @type {number} */
spriter.PointObject.prototype.parent_index = -1;
/** @type {spriter.Space} */
spriter.PointObject.prototype.local_space;
/** @type {spriter.Space} */
spriter.PointObject.prototype.world_space;

/**
 * @return {spriter.PointObject} 
 * @param {Object.<string,?>} json 
 */
spriter.PointObject.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.parent_index = spriter.loadInt(json, 'parent', -1);
	this.local_space.load(json);
	this.world_space.copy(this.local_space);
	return this;
}

/**
 * @return {spriter.PointObject}
 * @param {spriter.PointObject} other
 */
spriter.PointObject.prototype.copy = function (other)
{
	this.parent_index = other.parent_index;
	this.local_space.copy(other.local_space);
	this.world_space.copy(other.world_space);
	return this;
}

/**
 * @return {void}
 * @param {spriter.PointObject} other
 * @param {number} tween
 * @param {number} spin
 */
spriter.PointObject.prototype.tween = function (other, tween, spin)
{
	spriter.Space.tween(this.local_space, other.local_space, tween, spin, this.local_space);
}

/**
 * @constructor
 * @extends {spriter.Object}
 */
spriter.SoundObject = function ()
{
	goog.base(this, 'sound');
}

goog.inherits(spriter.SoundObject, spriter.Object);

/** @type {number} */
spriter.SoundObject.prototype.folder_index = -1;
/** @type {number} */
spriter.SoundObject.prototype.file_index = -1;
/** @type {boolean} */
spriter.SoundObject.prototype.trigger = false;
/** @type {number} */
spriter.SoundObject.prototype.volume = 1.0;
/** @type {number} */
spriter.SoundObject.prototype.panning = 0.0;

/**
 * @return {spriter.SoundObject} 
 * @param {Object.<string,?>} json 
 */
spriter.SoundObject.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.folder_index = spriter.loadInt(json, 'folder', -1);
	this.file_index = spriter.loadInt(json, 'file', -1);
	this.trigger = spriter.loadBool(json, 'trigger', false);
	this.volume = spriter.loadFloat(json, 'volume', 1.0);
	this.panning = spriter.loadFloat(json, 'panning', 0.0);
	return this;
}

/**
 * @return {spriter.SoundObject}
 * @param {spriter.SoundObject} other
 */
spriter.SoundObject.prototype.copy = function (other)
{
	this.folder_index = other.folder_index;
	this.file_index = other.file_index;
	this.trigger = other.trigger;
	this.volume = other.volume;
	this.panning = other.panning;
	return this;
}

/**
 * @return {void}
 * @param {spriter.SoundObject} other
 * @param {number} tween
 * @param {number} spin
 */
spriter.SoundObject.prototype.tween = function (other, tween, spin)
{
	this.volume = spriter.tween(this.volume, other.volume, tween);
	this.panning = spriter.tween(this.panning, other.panning, tween);
}

/**
 * @constructor
 * @extends {spriter.Object}
 */
spriter.EntityObject = function ()
{
	goog.base(this, 'entity');
	this.local_space = new spriter.Space();
	this.world_space = new spriter.Space();
}

goog.inherits(spriter.EntityObject, spriter.Object);

/** @type {number} */
spriter.EntityObject.prototype.parent_index = -1;
/** @type {spriter.Space} */
spriter.EntityObject.prototype.local_space;
/** @type {spriter.Space} */
spriter.EntityObject.prototype.world_space;
/** @type {number} */
spriter.EntityObject.prototype.entity_index = -1;
/** @type {number} */
spriter.EntityObject.prototype.animation_index = -1;
/** @type {number} */
spriter.EntityObject.prototype.animation_time = 0.0;
/** @type {spriter.Pose} */
spriter.EntityObject.prototype.pose;

/**
 * @return {spriter.EntityObject} 
 * @param {Object.<string,?>} json 
 */
spriter.EntityObject.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.parent_index = spriter.loadInt(json, 'parent', -1);
	this.local_space.load(json);
	this.world_space.copy(this.local_space);
	this.entity_index = spriter.loadInt(json, 'entity', -1);
	this.animation_index = spriter.loadInt(json, 'animation', -1);
	this.animation_time = spriter.loadFloat(json, 't', 0.0);
	return this;
}

/**
 * @return {spriter.EntityObject}
 * @param {spriter.EntityObject} other
 */
spriter.EntityObject.prototype.copy = function (other)
{
	this.parent_index = other.parent_index;
	this.local_space.copy(other.local_space);
	this.world_space.copy(other.world_space);
	this.entity_index = other.entity_index;
	this.animation_index = other.animation_index;
	this.animation_time = other.animation_time;
	return this;
}

/**
 * @return {void}
 * @param {spriter.EntityObject} other
 * @param {number} tween
 * @param {number} spin
 */
spriter.EntityObject.prototype.tween = function (other, tween, spin)
{
	spriter.Space.tween(this.local_space, other.local_space, tween, spin, this.local_space);
	this.animation_time = spriter.tween(this.animation_time, other.animation_time, tween);
}

/**
 * @constructor
 * @extends {spriter.Object}
 */
spriter.VariableObject = function ()
{
	goog.base(this, 'variable');
}

goog.inherits(spriter.VariableObject, spriter.Object);

/**
 * @return {spriter.VariableObject} 
 * @param {Object.<string,?>} json 
 */
spriter.VariableObject.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	return this;
}

/**
 * @return {spriter.VariableObject}
 * @param {spriter.VariableObject} other
 */
spriter.VariableObject.prototype.copy = function (other)
{
	return this;
}

/**
 * @return {void}
 * @param {spriter.VariableObject} other
 * @param {number} tween
 * @param {number} spin
 */
spriter.VariableObject.prototype.tween = function (other, tween, spin)
{
}

/**
 * @constructor
 * @extends {spriter.Element}
 */
spriter.Ref = function ()
{
	goog.base(this);
}

goog.inherits(spriter.Ref, spriter.Element);

/** @type {number} */
spriter.Ref.prototype.parent_index = -1;
/** @type {number} */
spriter.Ref.prototype.timeline_index = -1;
/** @type {number} */
spriter.Ref.prototype.keyframe_index = -1;

/**
 * @return {spriter.Ref} 
 * @param {Object.<string,?>} json 
 */
spriter.Ref.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.parent_index = spriter.loadInt(json, 'parent', -1);
	this.timeline_index = spriter.loadInt(json, 'timeline', -1);
	this.keyframe_index = spriter.loadInt(json, 'key', -1);
	return this;
}

/**
 * @constructor
 * @extends {spriter.Ref}
 */
spriter.BoneRef = function ()
{
	goog.base(this);
}

goog.inherits(spriter.BoneRef, spriter.Ref);

/**
 * @return {spriter.BoneRef} 
 * @param {Object.<string,?>} json 
 */
spriter.BoneRef.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	return this;
}

/**
 * @constructor
 * @extends {spriter.Ref}
 */
spriter.ObjectRef = function ()
{
	goog.base(this);
}

goog.inherits(spriter.ObjectRef, spriter.Ref);

/** @type {number} */
spriter.ObjectRef.prototype.z_index = 0;

/**
 * @return {spriter.ObjectRef} 
 * @param {Object.<string,?>} json 
 */
spriter.ObjectRef.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.z_index = spriter.loadInt(json, 'z_index', 0);
	return this;
}

/**
 * @constructor
 * @extends {spriter.Element}
 */
spriter.Keyframe = function ()
{
	goog.base(this);
}

goog.inherits(spriter.Keyframe, spriter.Element);

/** @type {number} */
spriter.Keyframe.prototype.time = 0;

/**
 * @return {spriter.Keyframe} 
 * @param {Object.<string,?>} json 
 */
spriter.Keyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.time = spriter.loadInt(json, 'time', 0);
	return this;
}

/**
 * @return {number} 
 * @param {Array.<spriter.Keyframe>} array 
 * @param {number} time 
 */
spriter.Keyframe.find = function (array, time)
{
	if (array.length <= 0) { return -1; }
	if (time < array[0].time) { return -1; }
	var last = array.length - 1;
	if (time >= array[last].time) { return last; }
	var lo = 0;
	var hi = last;
	if (hi === 0) { return 0; }
	var current = hi >> 1;
	while (true)
	{
		if (array[current + 1].time <= time) { lo = current + 1; } else { hi = current; }
		if (lo === hi) { return lo; }
		current = (lo + hi) >> 1;
	}
}

/**
 * @return {number} 
 * @param {spriter.Keyframe} a 
 * @param {spriter.Keyframe} b 
 */
spriter.Keyframe.compare = function (a, b)
{
	return a.time - b.time;
}

/**
 * @constructor
 */
spriter.Curve = function ()
{
}

spriter.Curve.prototype.type = "linear";
spriter.Curve.prototype.c1 = 0.0;
spriter.Curve.prototype.c2 = 0.0;
spriter.Curve.prototype.c3 = 0.0;
spriter.Curve.prototype.c4 = 0.0;

/**
 * @return {spriter.Curve} 
 * @param {Object.<string,?>} json 
 */
spriter.Curve.prototype.load = function (json)
{
	this.type = spriter.loadString(json, 'curve_type', "linear");
	this.c1 = spriter.loadFloat(json, 'c1', 0.0);
	this.c2 = spriter.loadFloat(json, 'c2', 0.0);
	this.c3 = spriter.loadFloat(json, 'c3', 0.0);
	this.c4 = spriter.loadFloat(json, 'c4', 0.0);
	return this;
}

spriter.Curve.prototype.evaluate = function (t)
{
	switch (this.type)
	{
	case "instant": return 0.0;
	case "linear": return t;
	case "quadratic": return spriter.interpolateQuadratic(0.0, this.c1, 1.0, t);
	case "cubic": return spriter.interpolateCubic(0.0, this.c1, this.c2, 1.0, t);
	case "quartic": return spriter.interpolateQuartic(0.0, this.c1, this.c2, this.c3, 1.0, t);
	case "quintic": return spriter.interpolateQuintic(0.0, this.c1, this.c2, this.c3, this.c4, 1.0, t);
	case "bezier": return spriter.interpolateBezier(this.c1, this.c2, this.c3, this.c4, t);
	}
	return 0.0;
}

/**
 * @constructor
 * @extends {spriter.Keyframe}
 */
spriter.MainlineKeyframe = function ()
{
	goog.base(this);
	this.curve = new spriter.Curve();
}

goog.inherits(spriter.MainlineKeyframe, spriter.Keyframe);

/** @type {spriter.Curve} */
spriter.MainlineKeyframe.prototype.curve;
/** @type {Array.<spriter.BoneRef>} */
spriter.MainlineKeyframe.prototype.bone_ref_array;
/** @type {Array.<spriter.ObjectRef>} */
spriter.MainlineKeyframe.prototype.object_ref_array;

/**
 * @return {spriter.MainlineKeyframe} 
 * @param {Object.<string,?>} json 
 */
spriter.MainlineKeyframe.prototype.load = function (json)
{
	var mainline_keyframe = this;

	goog.base(this, 'load', json);

	mainline_keyframe.curve.load(json);

	mainline_keyframe.bone_ref_array = [];
	json.bone_ref = spriter.makeArray(json.bone_ref);
	json.bone_ref.forEach(function (bone_ref_json)
	{
		mainline_keyframe.bone_ref_array.push(new spriter.BoneRef().load(bone_ref_json));
	});
	mainline_keyframe.bone_ref_array = mainline_keyframe.bone_ref_array.sort(function (a, b) { return a.id - b.id; });

	mainline_keyframe.object_ref_array = [];
	json.object_ref = spriter.makeArray(json.object_ref);
	json.object_ref.forEach(function (object_ref_json)
	{
		mainline_keyframe.object_ref_array.push(new spriter.ObjectRef().load(object_ref_json));
	});
	mainline_keyframe.object_ref_array = mainline_keyframe.object_ref_array.sort(function (a, b) { return a.id - b.id; });

	return mainline_keyframe;
}

/**
 * @constructor
 */
spriter.Mainline = function ()
{
}

/** @type {Array.<spriter.MainlineKeyframe>} */
spriter.Mainline.prototype.keyframe_array;

/**
 * @return {spriter.Mainline} 
 * @param {Object.<string,?>} json 
 */
spriter.Mainline.prototype.load = function (json)
{
	var mainline = this;

	mainline.keyframe_array = [];
	json.key = spriter.makeArray(json.key);
	json.key.forEach(function (key_json)
	{
		mainline.keyframe_array.push(new spriter.MainlineKeyframe().load(key_json));
	});
	mainline.keyframe_array = mainline.keyframe_array.sort(spriter.Keyframe.compare);

	return mainline;
}

/**
 * @constructor
 * @extends {spriter.Keyframe}
 * @param {string} type
 */
spriter.TimelineKeyframe = function (type)
{
	goog.base(this);
	this.type = type;
	this.curve = new spriter.Curve();
}

goog.inherits(spriter.TimelineKeyframe, spriter.Keyframe);

/** @type {string} */
spriter.TimelineKeyframe.prototype.type = "unknown";
/** @type {number} */
spriter.TimelineKeyframe.prototype.spin = 1; // 1: counter-clockwise, -1: clockwise
/** @type {spriter.Curve} */
spriter.TimelineKeyframe.prototype.curve;

/**
 * @return {spriter.TimelineKeyframe} 
 * @param {Object.<string,?>} json 
 */
spriter.TimelineKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json)
	//var type = spriter.loadString(json, 'type', "sprite");
	//if (this.type !== type) throw new Error();
	this.spin = spriter.loadInt(json, 'spin', 1);
	this.curve.load(json);
	return this;
}

/**
 * @constructor
 * @extends {spriter.TimelineKeyframe}
 */
spriter.SpriteTimelineKeyframe = function ()
{
	goog.base(this, 'sprite');
}

goog.inherits(spriter.SpriteTimelineKeyframe, spriter.TimelineKeyframe);

/** @type {spriter.SpriteObject} */
spriter.SpriteTimelineKeyframe.prototype.sprite;

/**
 * @return {spriter.TimelineKeyframe} 
 * @param {Object.<string,?>} json 
 */
spriter.SpriteTimelineKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.sprite = new spriter.SpriteObject().load(json.object || {});
	return this;
}

/**
 * @constructor
 * @extends {spriter.TimelineKeyframe}
 */
spriter.BoneTimelineKeyframe = function ()
{
	goog.base(this, 'bone');
}

goog.inherits(spriter.BoneTimelineKeyframe, spriter.TimelineKeyframe);

/** @type {spriter.Bone} */
spriter.BoneTimelineKeyframe.prototype.bone;

/**
 * @return {spriter.TimelineKeyframe} 
 * @param {Object.<string,?>} json 
 */
spriter.BoneTimelineKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.bone = new spriter.Bone().load(json.bone || {});
	return this;
}

/**
 * @constructor
 * @extends {spriter.TimelineKeyframe}
 */
spriter.BoxTimelineKeyframe = function ()
{
	goog.base(this, 'box');
}

goog.inherits(spriter.BoxTimelineKeyframe, spriter.TimelineKeyframe);

/** @type {spriter.BoxObject} */
spriter.BoxTimelineKeyframe.prototype.box;

/**
 * @return {spriter.TimelineKeyframe} 
 * @param {Object.<string,?>} json 
 */
spriter.BoxTimelineKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.box = new spriter.BoxObject().load(json.object || {});
	return this;
}

/**
 * @constructor
 * @extends {spriter.TimelineKeyframe}
 */
spriter.PointTimelineKeyframe = function ()
{
	goog.base(this, 'point');
}

goog.inherits(spriter.PointTimelineKeyframe, spriter.TimelineKeyframe);

/** @type {spriter.PointObject} */
spriter.PointTimelineKeyframe.prototype.point;

/**
 * @return {spriter.TimelineKeyframe} 
 * @param {Object.<string,?>} json 
 */
spriter.PointTimelineKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.point = new spriter.PointObject().load(json.object || {});
	return this;
}

/**
 * @constructor
 * @extends {spriter.TimelineKeyframe}
 */
spriter.SoundTimelineKeyframe = function ()
{
	goog.base(this, 'sound');
}

goog.inherits(spriter.SoundTimelineKeyframe, spriter.TimelineKeyframe);

/** @type {spriter.SoundObject} */
spriter.SoundTimelineKeyframe.prototype.sound;

/**
 * @return {spriter.TimelineKeyframe} 
 * @param {Object.<string,?>} json 
 */
spriter.SoundTimelineKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.sound = new spriter.SoundObject().load(json.object || {});
	return this;
}

/**
 * @constructor
 * @extends {spriter.TimelineKeyframe}
 */
spriter.EntityTimelineKeyframe = function ()
{
	goog.base(this, 'entity');
}

goog.inherits(spriter.EntityTimelineKeyframe, spriter.TimelineKeyframe);

/** @type {spriter.EntityObject} */
spriter.EntityTimelineKeyframe.prototype.entity;

/**
 * @return {spriter.TimelineKeyframe} 
 * @param {Object.<string,?>} json 
 */
spriter.EntityTimelineKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.entity = new spriter.EntityObject().load(json.object || {});
	return this;
}

/**
 * @constructor
 * @extends {spriter.TimelineKeyframe}
 */
spriter.VariableTimelineKeyframe = function ()
{
	goog.base(this, 'variable');
}

goog.inherits(spriter.VariableTimelineKeyframe, spriter.TimelineKeyframe);

/** @type {spriter.VariableObject} */
spriter.VariableTimelineKeyframe.prototype.variable;

/**
 * @return {spriter.TimelineKeyframe} 
 * @param {Object.<string,?>} json 
 */
spriter.VariableTimelineKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.variable = new spriter.VariableObject().load(json.object || {});
	return this;
}

/**
 * @constructor
 * @extends {spriter.Element}
 */
spriter.TagDef = function ()
{
	goog.base(this);
}

goog.inherits(spriter.TagDef, spriter.Element);

/** @type {number} */
spriter.TagDef.prototype.tag_index = -1;

/**
 * @return {spriter.TagDef} 
 * @param {Object.<string,?>} json 
 */
spriter.TagDef.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	return this;
}

/**
 * @constructor
 * @extends {spriter.Element}
 */
spriter.Tag = function ()
{
	goog.base(this);
}

goog.inherits(spriter.Tag, spriter.Element);

/** @type {number} */
spriter.Tag.prototype.tag_def_index = -1;

/**
 * @return {spriter.Tag} 
 * @param {Object.<string,?>} json 
 */
spriter.Tag.prototype.load = function (json)
{
	var tag = this;
	goog.base(this, 'load', json);
	tag.tag_def_index = spriter.loadInt(json, 't', -1);
	return this;
}

/**
 * @constructor
 * @extends {spriter.Keyframe}
 */
spriter.TaglineKeyframe = function ()
{
	goog.base(this);
}

goog.inherits(spriter.TaglineKeyframe, spriter.Keyframe);

/** @type {Array.<spriter.Tag>} */
spriter.TaglineKeyframe.prototype.tag_array;

/**
 * @return {spriter.TaglineKeyframe} 
 * @param {Object.<string,?>} json 
 */
spriter.TaglineKeyframe.prototype.load = function (json)
{
	var tagline_keyframe = this;
	goog.base(this, 'load', json);

	tagline_keyframe.tag_array = [];
	json.tag = spriter.makeArray(json.tag);
	json.tag.forEach(function (tag_json)
	{
		tagline_keyframe.tag_array.push(new spriter.Tag().load(tag_json));
	});

	return this;
}

/**
 * @constructor
 * @extends {spriter.Element}
 */
spriter.Tagline = function ()
{
	goog.base(this);
	this.keyframe_array = [];
}

goog.inherits(spriter.Tagline, spriter.Element);

/** @type {Array.<spriter.TaglineKeyframe>} */
spriter.Tagline.prototype.keyframe_array;

/**
 * @return {spriter.Tagline} 
 * @param {Object.<string,?>} json 
 */
spriter.Tagline.prototype.load = function (json)
{
	var tagline = this;
	goog.base(this, 'load', json);

	tagline.keyframe_array = [];
	json.key = spriter.makeArray(json.key);
	json.key.forEach(function (key_json)
	{
		tagline.keyframe_array.push(new spriter.TaglineKeyframe().load(key_json));
	});

	return this;
}

/**
 * @constructor
 * @extends {spriter.Keyframe}
 */
spriter.VarlineKeyframe = function ()
{
	goog.base(this);
}

goog.inherits(spriter.VarlineKeyframe, spriter.Keyframe);

/** @type {number|string} */
spriter.VarlineKeyframe.prototype.val;

/**
 * @return {spriter.VarlineKeyframe} 
 * @param {Object.<string,?>} json 
 */
spriter.VarlineKeyframe.prototype.load = function (json)
{
	var varline_keyframe = this;
	goog.base(this, 'load', json);
	switch (typeof(json.val))
	{
	case 'number':
		varline_keyframe.val = spriter.loadFloat(json, 'val', 0.0);
		break;
	case 'string':
		varline_keyframe.val = spriter.loadString(json, 'val', "");
		break;
	}
	return this;
}

/**
 * @constructor
 * @extends {spriter.Element}
 */
spriter.Varline = function ()
{
	goog.base(this);
}

goog.inherits(spriter.Varline, spriter.Element);

/** @type {number} */
spriter.Varline.prototype.var_def_index = -1;
/** @type {Array.<spriter.VarlineKeyframe>} */
spriter.Varline.prototype.keyframe_array;

/**
 * @return {spriter.Varline} 
 * @param {Object.<string,?>} json 
 */
spriter.Varline.prototype.load = function (json)
{
	var varline = this;

	goog.base(this, 'load', json);

	varline.var_def_index = spriter.loadInt(json, 'def', -1);

	varline.keyframe_array = [];
	json.key = spriter.makeArray(json.key);
	json.key.forEach(function (key_json)
	{
		varline.keyframe_array.push(new spriter.VarlineKeyframe().load(key_json));
	});

	return this;
}

/**
 * @constructor
 * @extends {spriter.Element}
 */
spriter.Meta = function ()
{
	goog.base(this);
}

goog.inherits(spriter.Meta, spriter.Element);

/** @type {spriter.Tagline} */
spriter.Meta.prototype.tagline;
/** @type {Array.<spriter.Varline>} */
spriter.Meta.prototype.varline_array;

/**
 * @return {spriter.Meta} 
 * @param {Object.<string,?>} json 
 */
spriter.Meta.prototype.load = function (json)
{
	var meta = this;

	goog.base(this, 'load', json);

	meta.tagline = new spriter.Tagline();
	if (json.tagline)
	{
		meta.tagline.load(json.tagline);
	}

	meta.varline_array = [];
	json.valline = json.valline || null; // HACK
	json.varline = json.varline || json.valline; // HACK
	if (json.varline)
	{
		json.varline = spriter.makeArray(json.varline);
		json.varline.forEach(function (varline_json)
		{
			meta.varline_array.push(new spriter.Varline().load(varline_json));
		});
	}

	return meta;
}

/**
 * @constructor
 * @extends {spriter.Element}
 */
spriter.Timeline = function ()
{
	goog.base(this);
}

goog.inherits(spriter.Timeline, spriter.Element);

/** @type {string} */
spriter.Timeline.prototype.type = "sprite";
/** @type {number} */
spriter.Timeline.prototype.object_index = -1;
/** @type {Array.<spriter.TimelineKeyframe>} */
spriter.Timeline.prototype.keyframe_array;
/** @type {spriter.Meta} */
spriter.Timeline.prototype.meta;

/**
 * @return {spriter.Timeline} 
 * @param {Object.<string,?>} json 
 */
spriter.Timeline.prototype.load = function (json)
{
	var timeline = this;

	goog.base(this, 'load', json);

	timeline.type = spriter.loadString(json, 'object_type', "sprite");
	timeline.object_index = spriter.loadInt(json, 'obj', -1);

	timeline.keyframe_array = [];
	json.key = spriter.makeArray(json.key);
	switch (timeline.type)
	{
	case 'sprite':
		json.key.forEach(function (key_json)
		{
			timeline.keyframe_array.push(new spriter.SpriteTimelineKeyframe().load(key_json));
		});
		break;
	case 'bone':
		json.key.forEach(function (key_json)
		{
			timeline.keyframe_array.push(new spriter.BoneTimelineKeyframe().load(key_json));
		});
		break;
	case 'box':
		json.key.forEach(function (key_json)
		{
			timeline.keyframe_array.push(new spriter.BoxTimelineKeyframe().load(key_json));
		});
		break;
	case 'point':
		json.key.forEach(function (key_json)
		{
			timeline.keyframe_array.push(new spriter.PointTimelineKeyframe().load(key_json));
		});
		break;
	case 'sound':
		json.key.forEach(function (key_json)
		{
			timeline.keyframe_array.push(new spriter.SoundTimelineKeyframe().load(key_json));
		});
		break;
	case 'entity':
		json.key.forEach(function (key_json)
		{
			timeline.keyframe_array.push(new spriter.EntityTimelineKeyframe().load(key_json));
		});
		break;
	case 'variable':
		json.key.forEach(function (key_json)
		{
			timeline.keyframe_array.push(new spriter.VariableTimelineKeyframe().load(key_json));
		});
		break;
	default:
		console.log("TODO: spriter.Timeline::load", timeline.type, json.key);
		break;
	}
	timeline.keyframe_array = timeline.keyframe_array.sort(spriter.Keyframe.compare);

	if (json.meta)
	{
		timeline.meta = new spriter.Meta().load(json.meta);
	}

	return timeline;
}

/**
 * @constructor
 * @extends {spriter.Keyframe}
 */
spriter.SoundlineKeyframe = function ()
{
	goog.base(this);
}

goog.inherits(spriter.SoundlineKeyframe, spriter.Keyframe);

/** @type {spriter.SoundObject} */
spriter.SoundlineKeyframe.prototype.sound;

/**
 * @return {spriter.SoundlineKeyframe} 
 * @param {Object.<string,?>} json 
 */
spriter.SoundlineKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.sound = new spriter.SoundObject().load(json.object || {});
	return this;
}

/**
 * @constructor
 * @extends {spriter.Element}
 */
spriter.Soundline = function ()
{
	goog.base(this);
}

goog.inherits(spriter.Soundline, spriter.Element);

/** @type {Array.<spriter.SoundlineKeyframe>} */
spriter.Soundline.prototype.keyframe_array;

/**
 * @return {spriter.Soundline} 
 * @param {Object.<string,?>} json 
 */
spriter.Soundline.prototype.load = function (json)
{
	var soundline = this;

	goog.base(this, 'load', json);

	soundline.keyframe_array = [];
	json.key = spriter.makeArray(json.key);
	json.key.forEach(function (key_json)
	{
		soundline.keyframe_array.push(new spriter.SoundlineKeyframe().load(key_json));
	});
	soundline.keyframe_array = soundline.keyframe_array.sort(spriter.Keyframe.compare);

	return soundline;
}

/**
 * @constructor
 * @extends {spriter.Keyframe}
 */
spriter.EventlineKeyframe = function ()
{
	goog.base(this);
}

goog.inherits(spriter.EventlineKeyframe, spriter.Keyframe);

///	/** @type {spriter.EventObject} */
///	spriter.EventlineKeyframe.prototype.event;

/**
 * @return {spriter.EventlineKeyframe} 
 * @param {Object.<string,?>} json 
 */
spriter.EventlineKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	///	this.event = new spriter.EventObject().load(json.object || {});
	return this;
}

/**
 * @constructor
 * @extends {spriter.Element}
 */
spriter.Eventline = function ()
{
	goog.base(this);
}

goog.inherits(spriter.Eventline, spriter.Element);

/** @type {Array.<spriter.EventlineKeyframe>} */
spriter.Eventline.prototype.keyframe_array;

/**
 * @return {spriter.Eventline} 
 * @param {Object.<string,?>} json 
 */
spriter.Eventline.prototype.load = function (json)
{
	var eventline = this;

	goog.base(this, 'load', json);

	eventline.keyframe_array = [];
	json.key = spriter.makeArray(json.key);
	json.key.forEach(function (key_json)
	{
		eventline.keyframe_array.push(new spriter.EventlineKeyframe().load(key_json));
	});
	eventline.keyframe_array = eventline.keyframe_array.sort(spriter.Keyframe.compare);

	return eventline;
}

/**
 * @constructor
 */
spriter.MapInstruction = function ()
{
}

/** @type {number} */
spriter.MapInstruction.prototype.folder_index = -1;
/** @type {number} */
spriter.MapInstruction.prototype.file_index = -1;
/** @type {number} */
spriter.MapInstruction.prototype.target_folder_index = -1;
/** @type {number} */
spriter.MapInstruction.prototype.target_file_index = -1;

/**
 * @return {spriter.MapInstruction} 
 * @param {Object.<string,?>} json 
 */
spriter.MapInstruction.prototype.load = function (json)
{
	var map_instruction = this;

	map_instruction.folder_index = spriter.loadInt(json, 'folder', -1);
	map_instruction.file_index = spriter.loadInt(json, 'file', -1);
	map_instruction.target_folder_index = spriter.loadInt(json, 'target_folder', -1);
	map_instruction.target_file_index = spriter.loadInt(json, 'target_file', -1);

	return map_instruction;
}

/**
 * @constructor
 * @extends {spriter.Element}
 */
spriter.CharacterMap = function ()
{
	var character_map = this;

	goog.base(this);

	character_map.map_instruction_array = [];
}

goog.inherits(spriter.CharacterMap, spriter.Element);

/** @type {Array.<spriter.MapInstruction>} */
spriter.CharacterMap.prototype.map_instruction_array;

/**
 * @return {spriter.CharacterMap} 
 * @param {Object.<string,?>} json 
 */
spriter.CharacterMap.prototype.load = function (json)
{
	var character_map = this;

	goog.base(this, 'load', json);

	character_map.map_instruction_array = [];
	json.map = spriter.makeArray(json.map);
	json.map.forEach(function (map_json)
	{
		var map_instruction = new spriter.MapInstruction().load(map_json);
		character_map.map_instruction_array.push(map_instruction);
	});

	return character_map;
}

/**
 * @constructor
 * @extends {spriter.Element}
 * @param {string} type
 */
spriter.VarDef = function (type)
{
	goog.base(this);
	this.type = type;
}

goog.inherits(spriter.VarDef, spriter.Element);

/** @type {string} */
spriter.VarDef.prototype.type = "unknown";

/**
 * @return {spriter.VarDef} 
 * @param {Object.<string,?>} json 
 */
spriter.VarDef.prototype.load = function (json)
{
	var var_def = this;
	goog.base(this, 'load', json);
	return this;
}

/**
 * @constructor
 * @extends {spriter.VarDef}
 */
spriter.IntVarDef = function ()
{
	goog.base(this, 'int');
}

goog.inherits(spriter.IntVarDef, spriter.VarDef);

/** @type {number} */
spriter.IntVarDef.prototype.default_value = 0;
/** @type {number} */
spriter.IntVarDef.prototype.value = 0;

/**
 * @return {spriter.IntVarDef} 
 * @param {Object.<string,?>} json 
 */
spriter.IntVarDef.prototype.load = function (json)
{
	var var_def = this;
	goog.base(this, 'load', json);
	var_def.value = var_def.default_value = spriter.loadInt(json, 'default_value', 0);
	return this;
}

/**
 * @constructor
 * @extends {spriter.VarDef}
 */
spriter.FloatVarDef = function ()
{
	goog.base(this, 'float');
}

goog.inherits(spriter.FloatVarDef, spriter.VarDef);

/** @type {number} */
spriter.FloatVarDef.prototype.default_value = 0.0;
/** @type {number} */
spriter.FloatVarDef.prototype.value = 0.0;

/**
 * @return {spriter.FloatVarDef} 
 * @param {Object.<string,?>} json 
 */
spriter.FloatVarDef.prototype.load = function (json)
{
	var var_def = this;
	goog.base(this, 'load', json);
	var_def.value = var_def.default_value = spriter.loadFloat(json, 'default_value', 0.0);
	return this;
}

/**
 * @constructor
 * @extends {spriter.VarDef}
 */
spriter.StringVarDef = function ()
{
	goog.base(this, 'string');
}

goog.inherits(spriter.StringVarDef, spriter.VarDef);

/** @type {string} */
spriter.StringVarDef.prototype.default_value = "";
/** @type {string} */
spriter.StringVarDef.prototype.value = "";

/**
 * @return {spriter.StringVarDef} 
 * @param {Object.<string,?>} json 
 */
spriter.StringVarDef.prototype.load = function (json)
{
	var var_def = this;
	goog.base(this, 'load', json);
	var_def.value = var_def.default_value = spriter.loadString(json, 'default_value', "");
	return this;
}

/**
 * @constructor
 * @extends {spriter.Element}
 */
spriter.VarDefs = function ()
{
	goog.base(this);
}

goog.inherits(spriter.VarDefs, spriter.Element);

/** @type {Array.<spriter.VarDef>} */
spriter.VarDefs.prototype.var_def_array;

/**
 * @return {spriter.VarDefs} 
 * @param {Object.<string,?>} json 
 */
spriter.VarDefs.prototype.load = function (json)
{
	var var_defs = this;

	goog.base(this, 'load', json);

	this.var_def_array = [];
	var json_var_def_array = [];
	if (typeof(json.i) === 'object')
	{
		// in SCML files, json.i is an object or array of objects
		json_var_def_array = spriter.makeArray(json.i);
	}
	else if ((typeof(json) === 'object') && (typeof(json.length) === 'number'))
	{
		// in SCON files, json is an array
		json_var_def_array = spriter.makeArray(json);
	}
	json_var_def_array.forEach(function (var_defs_json)
	{
		switch (var_defs_json.type)
		{
		case 'int':
			var_defs.var_def_array.push(new spriter.IntVarDef().load(var_defs_json));
			break;
		case 'float':
			var_defs.var_def_array.push(new spriter.FloatVarDef().load(var_defs_json));
			break;
		case 'string':
			var_defs.var_def_array.push(new spriter.StringVarDef().load(var_defs_json));
			break;
		default:
			console.log("TODO: spriter.VarDefs.load", var_defs_json.type, var_defs_json);
			var_defs.var_def_array.push(new spriter.VarDef(var_defs_json.type).load(var_defs_json));
			break;
		}
	});

	return this;
}

/**
 * @constructor
 * @extends {spriter.Element}
 * @param {string} type
 */
spriter.ObjInfo = function (type)
{
	goog.base(this);
	this.type = type;
}

goog.inherits(spriter.ObjInfo, spriter.Element);

/** @type {string} */
spriter.ObjInfo.prototype.type = "unknown";
/** @type {spriter.VarDefs} */
spriter.ObjInfo.prototype.var_defs;

/**
 * @return {spriter.ObjInfo} 
 * @param {Object.<string,?>} json 
 */
spriter.ObjInfo.prototype.load = function (json)
{
	var obj_info = this;

	goog.base(this, 'load', json);

	//var type = spriter.loadString(json, 'type', "unknown");
	//if (this.type !== type) throw new Error();

	this.var_defs = new spriter.VarDefs().load(json.var_defs || {});

	return this;
}

/**
 * @constructor
 */
spriter.SpriteFrame = function ()
{
}

/** @type {number} */
spriter.SpriteFrame.prototype.folder_index = -1;
/** @type {number} */
spriter.SpriteFrame.prototype.file_index = -1;

/**
 * @return {spriter.SpriteFrame} 
 * @param {Object.<string,?>} json 
 */
spriter.SpriteFrame.prototype.load = function (json)
{
	this.folder_index = spriter.loadInt(json, 'folder', -1);
	this.file_index = spriter.loadInt(json, 'file', -1);
	return this;
}

/**
 * @constructor
 * @extends {spriter.ObjInfo}
 */
spriter.SpriteObjInfo = function ()
{
	goog.base(this, 'sprite');
}

goog.inherits(spriter.SpriteObjInfo, spriter.ObjInfo);

/** @type {Array.<spriter.SpriteFrame>} */
spriter.SpriteObjInfo.prototype.sprite_frame_array;

/**
 * @return {spriter.SpriteObjInfo} 
 * @param {Object.<string,?>} json 
 */
spriter.SpriteObjInfo.prototype.load = function (json)
{
	var obj_info = this;

	goog.base(this, 'load', json);

	obj_info.sprite_frame_array = [];
	json.frames = spriter.makeArray(json.frames);
	json.frames.forEach(function (frames_json)
	{
		obj_info.sprite_frame_array.push(new spriter.SpriteFrame().load(frames_json));
	});

	return this;
}

/**
 * @constructor
 * @extends {spriter.ObjInfo}
 */
spriter.BoneObjInfo = function ()
{
	goog.base(this, 'bone');
}

goog.inherits(spriter.BoneObjInfo, spriter.ObjInfo);

/** @type {number} */
spriter.BoneObjInfo.prototype.w = 0;
/** @type {number} */
spriter.BoneObjInfo.prototype.h = 0;

/**
 * @return {spriter.BoneObjInfo} 
 * @param {Object.<string,?>} json 
 */
spriter.BoneObjInfo.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.w = spriter.loadInt(json, 'w', 0);
	this.h = spriter.loadInt(json, 'h', 0);
	return this;
}

/**
 * @constructor
 * @extends {spriter.ObjInfo}
 */
spriter.BoxObjInfo = function ()
{
	goog.base(this, 'box');
}

goog.inherits(spriter.BoxObjInfo, spriter.ObjInfo);

/** @type {number} */
spriter.BoxObjInfo.prototype.w = 0.0;
/** @type {number} */
spriter.BoxObjInfo.prototype.h = 0.0;

/**
 * @return {spriter.BoxObjInfo} 
 * @param {Object.<string,?>} json 
 */
spriter.BoxObjInfo.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.w = spriter.loadFloat(json, 'w', 0.0);
	this.h = spriter.loadFloat(json, 'h', 0.0);
	return this;
}

/**
 * @constructor
 * @extends {spriter.Element}
 */
spriter.Animation = function ()
{
	goog.base(this);
}

goog.inherits(spriter.Animation, spriter.Element);

/** @type {number} */
spriter.Animation.prototype.length = 0;
/** @type {string} */
spriter.Animation.prototype.looping = "true"; // "true", "false" or "ping_pong"
/** @type {number} */
spriter.Animation.prototype.loop_to = 0;
/** @type {spriter.Mainline} */
spriter.Animation.prototype.mainline;
/** @type {Array.<spriter.Timeline>} */
spriter.Animation.prototype.timeline_array;
/** @type {Array.<spriter.Soundline>} */
spriter.Animation.prototype.soundline_array;
/** @type {Array.<spriter.Eventline>} */
spriter.Animation.prototype.eventline_array;
/** @type {spriter.Meta} */
spriter.Animation.prototype.meta;
/** @type {number} */
spriter.Animation.prototype.min_time = 0;
/** @type {number} */
spriter.Animation.prototype.max_time = 0;

/**
 * @return {spriter.Animation} 
 * @param {Object.<string,?>} json 
 */
spriter.Animation.prototype.load = function (json)
{
	var anim = this;

	goog.base(this, 'load', json);

	anim.length = spriter.loadInt(json, 'length', 0);
	anim.looping = spriter.loadString(json, 'looping', "true");
	anim.loop_to = spriter.loadInt(json, 'loop_to', 0);

	anim.mainline = new spriter.Mainline().load(json.mainline || {});

	anim.timeline_array = [];
	json.timeline = spriter.makeArray(json.timeline);
	json.timeline.forEach(function (timeline_json)
	{
		anim.timeline_array.push(new spriter.Timeline().load(timeline_json));
	});

	anim.soundline_array = [];
	json.soundline = spriter.makeArray(json.soundline);
	json.soundline.forEach(function (soundline_json)
	{
		anim.soundline_array.push(new spriter.Soundline().load(soundline_json));
	});

	anim.eventline_array = [];
	json.eventline = spriter.makeArray(json.eventline);
	json.eventline.forEach(function (eventline_json)
	{
		anim.eventline_array.push(new spriter.Eventline().load(eventline_json));
	});

	if (json.meta)
	{
		anim.meta = new spriter.Meta().load(json.meta);
	}

	anim.min_time = 0;
	anim.max_time = anim.length;

	return anim;
}

/**
 * @constructor
 * @extends {spriter.Element}
 */
spriter.Entity = function ()
{
	goog.base(this);
}

goog.inherits(spriter.Entity, spriter.Element);

/** @type {Object.<string,spriter.CharacterMap>} */
spriter.Entity.prototype.character_map_map;
/** @type {Array.<string>} */
spriter.Entity.prototype.character_map_keys;
/** @type {spriter.VarDefs} */
spriter.Entity.prototype.var_defs;
/** @type {Object.<string,spriter.ObjInfo>} */
spriter.Entity.prototype.obj_info_map;
/** @type {Array.<string>} */
spriter.Entity.prototype.obj_info_keys;
/** @type {Object.<string,spriter.Animation>} */
spriter.Entity.prototype.animation_map;
/** @type {Array.<string>} */
spriter.Entity.prototype.animation_keys;

/**
 * @return {spriter.Entity} 
 * @param {Object.<string,?>} json 
 */
spriter.Entity.prototype.load = function (json)
{
	var entity = this;

	goog.base(this, 'load', json);

	entity.character_map_map = {};
	entity.character_map_keys = [];
	json.character_map = spriter.makeArray(json.character_map);
	json.character_map.forEach(function (character_map_json)
	{
		var character_map = new spriter.CharacterMap().load(character_map_json);
		entity.character_map_map[character_map.name] = character_map;
		entity.character_map_keys.push(character_map.name);
	});

	this.var_defs = new spriter.VarDefs().load(json.var_defs || {});

	entity.obj_info_map = {};
	entity.obj_info_keys = [];
	json.obj_info = spriter.makeArray(json.obj_info);
	json.obj_info.forEach(function (obj_info_json)
	{
		switch (obj_info_json.type)
		{
		case 'sprite':
			var obj_info = new spriter.SpriteObjInfo().load(obj_info_json);
			break;
		case 'bone':
			var obj_info = new spriter.BoneObjInfo().load(obj_info_json);
			break;
		case 'box':
			var obj_info = new spriter.BoxObjInfo().load(obj_info_json);
			break;
		case 'point':
		case 'sound':
		case 'entity':
		case 'variable':
		default:
			console.log("TODO: spriter.Entity.load", obj_info_json.type, obj_info_json);
			var obj_info = new spriter.ObjInfo(obj_info_json.type).load(obj_info_json);
			break;
		}
		entity.obj_info_map[obj_info.name] = obj_info;
		entity.obj_info_keys.push(obj_info.name);
	});

	entity.animation_map = {};
	entity.animation_keys = [];
	json.animation = spriter.makeArray(json.animation);
	json.animation.forEach(function (animation_json)
	{
		var animation = new spriter.Animation().load(animation_json);
		entity.animation_map[animation.name] = animation;
		entity.animation_keys.push(animation.name);
	});

	return entity;
}

/**
 * @constructor
 */
spriter.Data = function ()
{
	var data = this;

	data.folder_array = [];
	data.entity_map = {};
	data.entity_keys = [];
}

/** @type {Array.<spriter.Folder>} */
spriter.Data.prototype.folder_array;

/** @type {Array.<spriter.TagDef>} */
spriter.Data.prototype.tag_def_array;

/** @type {Object.<string,spriter.Entity>} */
spriter.Data.prototype.entity_map;
/** @type {Array.<string>} */
spriter.Data.prototype.entity_keys;

/**
 * @return {spriter.Data} 
 * @param {?} json 
 */
spriter.Data.prototype.load = function (json)
{
	var data = this;

	json = json || {};

	var scon_version = spriter.loadString(json, 'scon_version', "");
	var generator = spriter.loadString(json, 'generator', "");
	var generator_version = spriter.loadString(json, 'generator_version', "");

	data.folder_array = [];
	json.folder = spriter.makeArray(json.folder);
	json.folder.forEach(function (folder_json)
	{
		data.folder_array.push(new spriter.Folder().load(folder_json));
	});

	data.tag_def_array = [];
	json.tag_list = spriter.makeArray(json.tag_list);
	json.tag_list.forEach(function (tag_list_json)
	{
		data.tag_def_array.push(new spriter.TagDef().load(tag_list_json));
	});

	data.entity_map = {};
	data.entity_keys = [];
	json.entity = spriter.makeArray(json.entity);
	json.entity.forEach(function (entity_json)
	{
		var entity = new spriter.Entity().load(entity_json);
		data.entity_map[entity.name] = entity;
		data.entity_keys.push(entity.name);
	});

	// patch spriter.Object::pivot

	data.entity_keys.forEach(function (entity_key)
	{
		var entity = data.entity_map[entity_key];

		entity.animation_keys.forEach(function (animation_key)
		{
			var animation = entity.animation_map[animation_key];

			animation.timeline_array.forEach(function (timeline)
			{
				timeline.keyframe_array.forEach(function (timeline_keyframe)
				{
					if (timeline_keyframe instanceof spriter.SpriteTimelineKeyframe)
					{
						var sprite = timeline_keyframe.sprite;
						if (sprite.default_pivot)
						{
							var folder = data.folder_array[sprite.folder_index];
							var file = folder && folder.file_array[sprite.file_index];
							if (file)
							{
								sprite.pivot.copy(file.pivot);
							}
						}
					}
				});
			});
		});
	});
	
	return data;
}

/**
 * @return {Object.<string, spriter.Entity>} 
 */
spriter.Data.prototype.getEntities = function ()
{
	return this.entity_map;
}

/**
 * @return {Array.<string>} 
 */
spriter.Data.prototype.getEntityKeys = function ()
{
	return this.entity_keys;
}

/**
 * @return {Object.<string, spriter.Animation>} 
 * @param {string} entity_key 
 */
spriter.Data.prototype.getAnims = function (entity_key)
{
	var entity = this.entity_map && this.entity_map[entity_key];
	if (entity)
	{
		return entity.animation_map;
	}
	return {};
}

/**
 * @return {Array.<string>} 
 * @param {string} entity_key 
 */
spriter.Data.prototype.getAnimKeys = function (entity_key)
{
	var entity = this.entity_map && this.entity_map[entity_key];
	if (entity)
	{
		return entity.animation_keys;
	}
	return [];
}

/**
 * @constructor 
 * @param {spriter.Data=} data 
 */
spriter.Pose = function (data)
{
	this.data = data || null;

	this.character_map_key_array = [];
	this.bone_array = [];
	this.object_array = [];
	this.sound_array = [];
	this.event_array = [];
	this.tag_array = [];
	this.var_map = {};
}

/** @type {spriter.Data} */
spriter.Pose.prototype.data;

/** @type {string} */
spriter.Pose.prototype.entity_key = "";
/** @type {Array.<string>} */
spriter.Pose.prototype.character_map_key_array;
/** @type {string} */
spriter.Pose.prototype.anim_key = "";
/** @type {number} */
spriter.Pose.prototype.time = 0;
/** @type {number} */
spriter.Pose.prototype.elapsed_time = 0;

/** @type {boolean} */
spriter.Pose.prototype.dirty = true;

/** @type {Array.<spriter.Bone>} */
spriter.Pose.prototype.bone_array;

/** @type {Array.<spriter.Object>} */
spriter.Pose.prototype.object_array;

/** @type {Array.<Object>} */
spriter.Pose.prototype.sound_array;

/** @type {Array.<string>} */
spriter.Pose.prototype.event_array;

/** @type {Array.<string>} */
spriter.Pose.prototype.tag_array;

/** @type {Object.<string,number|string>} */
spriter.Pose.prototype.var_map;

/**
 * @return {Object.<string, spriter.Entity>} 
 */
spriter.Pose.prototype.getEntities = function ()
{
	if (this.data)
	{
		return this.data.getEntities();
	}
	return null;
}

/**
 * @return {Array.<string>} 
 */
spriter.Pose.prototype.getEntityKeys = function ()
{
	if (this.data)
	{
		return this.data.getEntityKeys();
	}
	return null;
}

/**
 * @return {spriter.Entity} 
 */
spriter.Pose.prototype.curEntity = function ()
{
	var entity_map = this.data.entity_map;
	return entity_map && entity_map[this.entity_key];
}

/**
 * @return {string}
 */
spriter.Pose.prototype.getEntity = function ()
{
	return this.entity_key;
}

/**
 * @return {void}
 * @param {string} entity_key
 */
spriter.Pose.prototype.setEntity = function (entity_key)
{
	if (this.entity_key !== entity_key)
	{
		this.entity_key = entity_key;
		this.anim_key = "";
		this.time = 0;
		this.dirty = true;
		this.bone_array = [];
		this.object_array = [];
	}
}

/**
 * @return {Object.<string, spriter.Animation>} 
 */
spriter.Pose.prototype.getAnims = function ()
{
	if (this.data)
	{
		return this.data.getAnims(this.entity_key);
	}
	return null;
}

/**
 * @return {Object.<string>} 
 */
spriter.Pose.prototype.getAnimKeys = function ()
{
	if (this.data)
	{
		return this.data.getAnimKeys(this.entity_key);
	}
	return null;
}

/**
 * @return {spriter.Animation} 
 */
spriter.Pose.prototype.curAnim = function ()
{
	var anims = this.getAnims();
	return anims && anims[this.anim_key];
}

/**
 * @return {number} 
 */
spriter.Pose.prototype.curAnimLength = function ()
{
	var pose = this;
	var data = pose.data;
	var entity = data && data.entity_map[pose.entity_key];
	var anim = entity && entity.animation_map[pose.anim_key];
	return (anim && anim.length) || 0;
}

/**
 * @return {string}
 */
spriter.Pose.prototype.getAnim = function ()
{
	return this.anim_key;
}

/**
 * @return {void} 
 * @param {string} anim_key
 */
spriter.Pose.prototype.setAnim = function (anim_key)
{
	if (this.anim_key !== anim_key)
	{
		this.anim_key = anim_key;
		var anim = this.curAnim();
		if (anim)
		{
			this.time = spriter.wrap(this.time, anim.min_time, anim.max_time);
		}
		this.elapsed_time = 0;
		this.dirty = true;
	}
}

/**
 * @return {number}
 */
spriter.Pose.prototype.getTime = function ()
{
	return this.time;
}

/**
 * @return {void} 
 * @param {number} time 
 */
spriter.Pose.prototype.setTime = function (time)
{
	var anim = this.curAnim();
	if (anim)
	{
		time = spriter.wrap(time, anim.min_time, anim.max_time);
	}

	if (this.time !== time)
	{
		this.time = time;
		this.elapsed_time = 0;
		this.dirty = true;
	}
}

/**
 * @return {void}
 * @param {number} elapsed_time
 */
spriter.Pose.prototype.update = function (elapsed_time)
{
	var pose = this;
	pose.elapsed_time += elapsed_time;
	pose.dirty = true;
}

/**
 * @return {void}
 */
spriter.Pose.prototype.strike = function ()
{
	var pose = this;
	if (!pose.dirty) { return; }
	pose.dirty = false;

	var entity = pose.curEntity();

	pose.var_map = pose.var_map || {};
	entity.var_defs.var_def_array.forEach(function (var_def)
	{
		if (!(var_def.name in pose.var_map))
		{
			pose.var_map[var_def.name] = var_def.default_value;
		}
	});

	var anim = pose.curAnim();

	var prev_time = pose.time;
	var elapsed_time = pose.elapsed_time;

	pose.time = pose.time + pose.elapsed_time; // accumulate elapsed time
	pose.elapsed_time = 0; // reset elapsed time for next strike

	var wrapped_min = false;
	var wrapped_max = false;
	if (anim)
	{
		wrapped_min = (elapsed_time < 0) && (pose.time <= anim.min_time);
		wrapped_max = (elapsed_time > 0) && (pose.time >= anim.max_time);
		pose.time = spriter.wrap(pose.time, anim.min_time, anim.max_time);
	}

	var time = pose.time;

	if (anim)
	{
		var mainline_keyframe_array = anim.mainline.keyframe_array;
		var mainline_keyframe_index1 = spriter.Keyframe.find(mainline_keyframe_array, time);
		var mainline_keyframe_index2 = (mainline_keyframe_index1 + 1) % mainline_keyframe_array.length;
		var mainline_keyframe1 = mainline_keyframe_array[mainline_keyframe_index1];
		var mainline_keyframe2 = mainline_keyframe_array[mainline_keyframe_index2];
		var mainline_time1 = mainline_keyframe1.time;
		var mainline_time2 = mainline_keyframe2.time;
		if (mainline_time2 < mainline_time1) { mainline_time2 = anim.length; }
		var mainline_time = time;
		if (mainline_time1 !== mainline_time2)
		{
			var mainline_tween = (time - mainline_time1) / (mainline_time2 - mainline_time1);
			mainline_tween = mainline_keyframe1.curve.evaluate(mainline_tween);
			mainline_time = spriter.tween(mainline_time1, mainline_time2, mainline_tween);
		}

		var timeline_array = anim.timeline_array;

		var data_bone_array = mainline_keyframe1.bone_ref_array;
		var pose_bone_array = pose.bone_array;

		data_bone_array.forEach(function (data_bone, bone_index)
		{
			var timeline_index = data_bone.timeline_index;
			var timeline = timeline_array[timeline_index];
			var timeline_keyframe_array = timeline.keyframe_array;
			var keyframe_index1 = data_bone.keyframe_index;
			var keyframe_index2 = (keyframe_index1 + 1) % timeline_keyframe_array.length;
			var timeline_keyframe1 = timeline_keyframe_array[keyframe_index1];
			var timeline_keyframe2 = timeline_keyframe_array[keyframe_index2];
			var time1 = timeline_keyframe1.time;
			var time2 = timeline_keyframe2.time;
			if (time2 < time1) { time2 = anim.length; }
			var tween = 0.0;
			if (time1 !== time2)
			{
				tween = (mainline_time - time1) / (time2 - time1);
				tween = timeline_keyframe1.curve.evaluate(tween);
			}

			var pose_bone = pose_bone_array[bone_index] = (pose_bone_array[bone_index] || new spriter.Bone());
			pose_bone.copy(timeline_keyframe1.bone).tween(timeline_keyframe2.bone, tween, timeline_keyframe1.spin);
			pose_bone.name = timeline.name; // set name from timeline
			pose_bone.parent_index = data_bone.parent_index; // set parent from bone_ref
		});

		// clamp output bone array
		pose_bone_array.length = data_bone_array.length;

		// compute bone world space
		pose_bone_array.forEach(function (bone)
		{
			var parent_bone = pose_bone_array[bone.parent_index];
			if (parent_bone)
			{
				spriter.Space.combine(parent_bone.world_space, bone.local_space, bone.world_space);
			}
			else
			{
				bone.world_space.copy(bone.local_space);
			}
		});

		var data_object_array = mainline_keyframe1.object_ref_array;
		var pose_object_array = pose.object_array;

		data_object_array.forEach(function (data_object, object_index)
		{
			var timeline_index = data_object.timeline_index;
			var timeline = timeline_array[timeline_index];
			var timeline_keyframe_array = timeline.keyframe_array;
			var keyframe_index1 = data_object.keyframe_index;
			var keyframe_index2 = (keyframe_index1 + 1) % timeline_keyframe_array.length;
			var timeline_keyframe1 = timeline_keyframe_array[keyframe_index1];
			var timeline_keyframe2 = timeline_keyframe_array[keyframe_index2];
			var time1 = timeline_keyframe1.time;
			var time2 = timeline_keyframe2.time;
			if (time2 < time1) { time2 = anim.length; }
			var tween = 0.0;
			if (time1 !== time2)
			{
				tween = (mainline_time - time1) / (time2 - time1);
				tween = timeline_keyframe1.curve.evaluate(tween);
			}

			switch (timeline.type)
			{
			case 'sprite':
				var pose_sprite = pose_object_array[object_index] = (pose_object_array[object_index] || new spriter.SpriteObject());
				pose_sprite.copy(timeline_keyframe1.sprite).tween(timeline_keyframe2.sprite, tween, timeline_keyframe1.spin);
				pose_sprite.name = timeline.name; // set name from timeline
				pose_sprite.parent_index = data_object.parent_index; // set parent from object_ref
				break;
			case 'bone':
				var pose_bone = pose_object_array[object_index] = (pose_object_array[object_index] || new spriter.Bone());
				pose_bone.copy(timeline_keyframe1.bone).tween(timeline_keyframe2.bone, tween, timeline_keyframe1.spin);
				pose_bone.name = timeline.name; // set name from timeline
				pose_bone.parent_index = data_object.parent_index; // set parent from object_ref
				break;
			case 'box':
				var pose_box = pose_object_array[object_index] = (pose_object_array[object_index] || new spriter.BoxObject());
				pose_box.copy(timeline_keyframe1.box).tween(timeline_keyframe2.box, tween, timeline_keyframe1.spin);
				pose_box.name = timeline.name; // set name from timeline
				pose_box.parent_index = data_object.parent_index; // set parent from object_ref
				break;
			case 'point':
				var pose_point = pose_object_array[object_index] = (pose_object_array[object_index] || new spriter.PointObject());
				pose_point.copy(timeline_keyframe1.point).tween(timeline_keyframe2.point, tween, timeline_keyframe1.spin);
				pose_point.name = timeline.name;
				pose_point.parent_index = data_object.parent_index; // set parent from object_ref
				break;
			case 'sound':
				var pose_sound = pose_object_array[object_index] = (pose_object_array[object_index] || new spriter.SoundObject());
				pose_sound.copy(timeline_keyframe1.sound).tween(timeline_keyframe2.sound, tween, timeline_keyframe1.spin);
				pose_sound.name = timeline.name;
				break;
			case 'entity':
				var pose_entity = pose_object_array[object_index] = (pose_object_array[object_index] || new spriter.EntityObject());
				pose_entity.copy(timeline_keyframe1.entity).tween(timeline_keyframe2.entity, tween, timeline_keyframe1.spin);
				pose_entity.name = timeline.name;
				pose_entity.parent_index = data_object.parent_index; // set parent from object_ref
				break;
			case 'variable':
				var pose_variable = pose_object_array[object_index] = (pose_object_array[object_index] || new spriter.VariableObject());
				pose_variable.name = timeline.name;
				pose_variable.copy(timeline_keyframe1.variable).tween(timeline_keyframe2.variable, tween, timeline_keyframe1.spin);
				break;
			default:
				throw new Error(timeline.type);
			}
		});

		// clamp output object array
		pose_object_array.length = data_object_array.length;

		// apply character map
		pose.character_map_key_array.forEach(function (character_map_key)
		{
			var character_map = entity.character_map_map[character_map_key];
			if (character_map)
			{
				character_map.map_instruction_array.forEach(function (map_instruction)
				{
					pose_object_array.forEach(function (object)
					{
						switch (object.type)
						{
						case 'sprite':
							if ((object.folder_index === map_instruction.folder_index) && 
								(object.file_index === map_instruction.file_index))
							{
								object.folder_index = map_instruction.target_folder_index;
								object.file_index = map_instruction.target_file_index;
							}
							break;
						case 'bone':
						case 'box':
						case 'sound':
						case 'event':
						case 'entity':
						case 'variable':
							break;
						default:
							throw new Error(object.type);
						}
					});
				});
			}
		});

		// compute object world space
		pose_object_array.forEach(function (object)
		{
			switch (object.type)
			{
			case 'sprite':
				var bone = pose_bone_array[object.parent_index];
				if (bone)
				{
					spriter.Space.combine(bone.world_space, object.local_space, object.world_space);
				}
				else
				{
					object.world_space.copy(object.local_space);
				}
				var folder = pose.data.folder_array[object.folder_index];
				var file = folder && folder.file_array[object.file_index];
				if (file)
				{
					var offset_x = (0.5 - object.pivot.x) * file.width;
					var offset_y = (0.5 - object.pivot.y) * file.height;
					spriter.Space.translate(object.world_space, offset_x, offset_y);
				}
				break;
			case 'bone':
				var bone = pose_bone_array[object.parent_index];
				if (bone)
				{
					spriter.Space.combine(bone.world_space, object.local_space, object.world_space);
				}
				else
				{
					object.world_space.copy(object.local_space);
				}
				break;
			case 'box':
				var bone = pose_bone_array[object.parent_index];
				if (bone)
				{
					spriter.Space.combine(bone.world_space, object.local_space, object.world_space);
				}
				else
				{
					object.world_space.copy(object.local_space);
				}
				var box_info = entity.obj_info_map[object.name];
				if (box_info)
				{
					var offset_x = (0.5 - object.pivot.x) * box_info.w;
					var offset_y = (0.5 - object.pivot.y) * box_info.h;
					spriter.Space.translate(object.world_space, offset_x, offset_y);
				}
				break;
			case 'point':
				var bone = pose_bone_array[object.parent_index];
				if (bone)
				{
					spriter.Space.combine(bone.world_space, object.local_space, object.world_space);
				}
				else
				{
					object.world_space.copy(object.local_space);
				}
				break;
			case 'sound':
				break;
			case 'entity':
				var bone = pose_bone_array[object.parent_index];
				if (bone)
				{
					spriter.Space.combine(bone.world_space, object.local_space, object.world_space);
				}
				else
				{
					object.world_space.copy(object.local_space);
				}
				break;
			case 'variable':
				break;
			default:
				throw new Error(object.type);
			}
		});

		// process sub-entities
		pose_object_array.forEach(function (object)
		{
			switch (object.type)
			{
			case 'entity':
				var sub_pose = object.pose = object.pose || new spriter.Pose(pose.data);
				var sub_entity_key = sub_pose.data.entity_keys[object.entity_index];
				if (sub_entity_key !== sub_pose.getEntity())
				{
					sub_pose.setEntity(sub_entity_key);
				}
				var sub_entity = sub_pose.curEntity();
				var sub_anim_key = sub_entity.animation_keys[object.animation_index];
				if (sub_anim_key !== sub_pose.getAnim())
				{
					sub_pose.setAnim(sub_anim_key);
					var anim_length = sub_pose.curAnimLength();
					var sub_time = object.animation_time * anim_length;
					sub_pose.setTime(sub_time);
				}
				else
				{
					var anim_length = sub_pose.curAnimLength();
					var sub_time = object.animation_time * anim_length;
					var sub_dt = sub_time - sub_pose.getTime();
					sub_pose.update(sub_dt);
				}
				sub_pose.strike();
				break;
			}
		});

		// process soundlines
		pose.sound_array = [];
		anim.soundline_array.forEach(function (soundline)
		{
			var keyframe_array = soundline.keyframe_array;
			var keyframe_index = spriter.Keyframe.find(keyframe_array, time);
			if (keyframe_index !== -1)
			{
				var keyframe = keyframe_array[keyframe_index];
				if (((elapsed_time < 0) && ((time <= keyframe.time) && (keyframe.time <= prev_time))) ||
					((elapsed_time > 0) && ((prev_time <= keyframe.time) && (keyframe.time <= time))))
				{
					var folder = pose.data.folder_array[keyframe.sound.folder_index];
					var file = folder && folder.file_array[keyframe.sound.file_index];
					//console.log(prev_time, keyframe.time, time, "sound", file.name);
					pose.sound_array.push({ name: file.name, volume: keyframe.sound.volume, panning: keyframe.sound.panning });
				}
			}
		});

		// process eventlines
		pose.event_array = [];
		anim.eventline_array.forEach(function (eventline)
		{
			var keyframe_array = eventline.keyframe_array;
			var keyframe_index = spriter.Keyframe.find(keyframe_array, time);
			if (keyframe_index !== -1)
			{
				var keyframe = keyframe_array[keyframe_index];
				if (((elapsed_time < 0) && ((time <= keyframe.time) && (keyframe.time <= prev_time))) ||
					((elapsed_time > 0) && ((prev_time <= keyframe.time) && (keyframe.time <= time))))
				{
					//console.log(prev_time, keyframe.time, time, "event", eventline.name);
					pose.event_array.push(eventline.name);
				}
			}
		});

		if (anim.meta)
		{
			// process tagline
			if (anim.meta.tagline)
			{
				var keyframe_array = anim.meta.tagline.keyframe_array;
				var keyframe_index = spriter.Keyframe.find(keyframe_array, time);
				if (keyframe_index !== -1)
				{
					var keyframe = keyframe_array[keyframe_index];
					if (((elapsed_time < 0) && ((time <= keyframe.time) && (keyframe.time <= prev_time))) ||
						((elapsed_time > 0) && ((prev_time <= keyframe.time) && (keyframe.time <= time))))
					{
						pose.tag_array = [];
						keyframe.tag_array.forEach(function (tag)
						{
							var tag_def = pose.data.tag_def_array[tag.tag_def_index];
							pose.tag_array.push(tag_def.name);
						});
						pose.tag_array = pose.tag_array.sort();
						//console.log(prev_time, keyframe.time, time, "tag", pose.tag_array);
					}
				}
			}

			// process varlines
			pose.var_map = pose.var_map || {};
			anim.meta.varline_array.forEach(function (varline)
			{
				var keyframe_array = varline.keyframe_array;
				var keyframe_index1 = spriter.Keyframe.find(keyframe_array, time);
				if (keyframe_index1 !== -1)
				{
					var keyframe_index2 = (keyframe_index1 + 1) % keyframe_array.length;
					var keyframe1 = keyframe_array[keyframe_index1];
					var keyframe2 = keyframe_array[keyframe_index2];
					var time1 = keyframe1.time;
					var time2 = keyframe2.time;
					if (time2 < time1) { time2 = anim.length; }
					var tween = 0.0;
					if (time1 !== time2)
					{
						tween = (time - time1) / (time2 - time1);
						// TODO: tween = keyframe1.curve.evaluate(tween);
					}
					var var_def = entity.var_defs.var_def_array[varline.var_def_index];
					var val = 0;
					switch (var_def.type)
					{
					case 'int':
						val = 0 | spriter.tween(+keyframe1.val, +keyframe2.val, tween);
						break;
					case 'float':
						val = spriter.tween(+keyframe1.val, +keyframe2.val, tween);
						break;
					case 'string':
						val = keyframe1.val;
					}
					//console.log(prev_time, keyframe.time, time, "var", var_def.name, val, var_def.default_value);
					pose.var_map[var_def.name] = val;
				}
			});
		}
	}
}
goog.provide('renderCtx2D');

/**
 * @constructor
 * @param {CanvasRenderingContext2D} ctx
 */
renderCtx2D = function (ctx)
{
	var render = this;
	render.ctx = ctx;
	render.images = {};
	render.skin_info_map = {};
	render.region_vertex_position = new Float32Array([ -1, -1,  1, -1,  1,  1, -1,  1 ]); // [ x, y ]
	render.region_vertex_texcoord = new Float32Array([  0,  1,  1,  1,  1,  0,  0,  0 ]); // [ u, v ]
	render.region_vertex_triangle = new Uint16Array([ 0, 1, 2, 0, 2, 3 ]); // [ i0, i1, i2 ]
}

/**
 * @return {void}
 * @param {spine.Pose} spriter_pose
 * @param {atlas.Data} atlas_data
 */
renderCtx2D.prototype.dropPose = function (spriter_pose, atlas_data)
{
	var render = this;

	for (var image_key in render.images)
	{
		delete render.images[image_key];
	}

	render.images = {};
	render.skin_info_map = {};
}

/**
 * @return {void}
 * @param {spine.Pose} spriter_pose
 * @param {atlas.Data} atlas_data
 * @param {Object.<string,HTMLImageElement>} images
 */
renderCtx2D.prototype.loadPose = function (spriter_pose, atlas_data, images)
{
	var render = this;

	render.images = images;
}

/**
 * @return {void}
 * @param {spine.Pose} spriter_pose
 * @param {atlas.Data} atlas_data
 */
renderCtx2D.prototype.drawPose = function (spriter_pose, atlas_data)
{
	var render = this;
	var ctx = render.ctx;

	var images = render.images;

	var positions = render.region_vertex_position;
	var texcoords = render.region_vertex_texcoord;
	var triangles = render.region_vertex_triangle;

	spriter_pose.object_array.forEach(function (object)
	{
		switch (object.type)
		{
		case 'sprite':
			var folder = spriter_pose.data.folder_array[object.folder_index];
			if (!folder) { return; }
			var file = folder.file_array[object.file_index];
			if (!file) { return; }
			var site = atlas_data && atlas_data.sites[file.name];
			var page = site && atlas_data.pages[site.page];
			var image_key = (page && page.name) || file.name;
			var image = images[image_key];
			if (image && image.complete)
			{
				ctx.save();
				ctxApplySpace(ctx, object.world_space);
				ctx.scale(file.width/2, file.height/2);
				ctxApplyAtlasSitePosition(ctx, site);
				ctx.globalAlpha *= object.alpha;
				ctxDrawImageMesh(ctx, triangles, positions, texcoords, image, site, page);
				ctx.restore();
			}
			break;
		case 'entity':
			ctx.save();
			ctxApplySpace(ctx, object.world_space);
			render.drawPose(object.pose, atlas_data); // recursive
			ctx.restore();
			break;
		}
	});
}

/**
 * @return {void}
 * @param {spine.Pose} spriter_pose
 * @param {atlas.Data} atlas_data
 */
renderCtx2D.prototype.drawDebugPose = function (spriter_pose, atlas_data)
{
	var render = this;
	var ctx = render.ctx;

	var images = render.images;

	var positions = render.region_vertex_position;
	var triangles = render.region_vertex_triangle;

	spriter_pose.bone_array.forEach(function (bone)
	{
		ctx.save();
		ctxApplySpace(ctx, bone.world_space);
		ctxDrawPoint(ctx);
		var entity = spriter_pose.data.entity_map[spriter_pose.entity_key];
		var bone_info = entity.obj_info_map[bone.name];
		if (bone_info)
		{
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(bone_info.h/2, -bone_info.h/2);
			ctx.lineTo(bone_info.w, 0);
			ctx.lineTo(bone_info.h/2, bone_info.h/2);
			ctx.closePath();
			ctx.strokeStyle = 'cyan';
			ctx.stroke();
		}
		ctx.restore();
	});

	spriter_pose.object_array.forEach(function (object)
	{
		switch (object.type)
		{
		case 'sprite':
			var folder = spriter_pose.data.folder_array[object.folder_index];
			if (!folder) { return; }
			var file = folder.file_array[object.file_index];
			if (!file) { return; }
			var site = atlas_data && atlas_data.sites[file.name];
			var page = site && atlas_data.pages[site.page];
			var image_key = (page && page.name) || file.name;
			var image = images[image_key];
			ctx.save();
			ctxApplySpace(ctx, object.world_space);
			ctx.scale(file.width/2, file.height/2);
			ctx.lineWidth = 1 / Math.min(file.width/2, file.height/2);
			ctxApplyAtlasSitePosition(ctx, site);
			ctxDrawMesh(ctx, triangles, positions);
			ctx.restore();
			break;
		case 'bone':
			ctx.save();
			ctxApplySpace(ctx, object.world_space);
			var entity = spriter_pose.data.entity_map[spriter_pose.entity_key];
			var bone_info = entity.obj_info_map[object.name];
			if (bone_info)
			{
				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.lineTo(bone_info.h/2, -bone_info.h/2);
				ctx.lineTo(bone_info.w, 0);
				ctx.lineTo(bone_info.h/2, bone_info.h/2);
				ctx.closePath();
				ctx.strokeStyle = 'cyan';
				ctx.stroke();
			}
			ctx.restore();
			break;
		case 'box':
			var entity = spriter_pose.data.entity_map[spriter_pose.entity_key];
			var box_info = entity.obj_info_map[object.name];
			if (box_info)
			{
				ctx.save();
				ctxApplySpace(ctx, object.world_space);
				ctx.beginPath();
				ctx.rect(-box_info.w/2, -box_info.h/2, box_info.w, box_info.h);
				ctx.strokeStyle = 'magenta';
				ctx.stroke();
				ctx.restore();
			}
			break;
		case 'point':
			ctx.save();
			ctxApplySpace(ctx, object.world_space);
			ctxDrawPoint(ctx);
			ctx.restore();
			break;
		case 'sound':
			break;
		case 'entity':
			ctx.save();
			ctxApplySpace(ctx, object.world_space);
			ctxDrawPoint(ctx);
			render.drawDebugPose(object.pose, atlas_data); // recursive
			ctx.restore();
			break;
		case 'variable':
			break;
		}
	});
}

function ctxApplySpace (ctx, space)
{
	if (space)
	{
		ctx.translate(space.position.x, space.position.y);
		ctx.rotate(space.rotation.rad);
		ctx.scale(space.scale.x, space.scale.y);
	}
}

function ctxApplyAtlasSitePosition (ctx, site)
{
	if (site)
	{
		ctx.scale(1 / site.original_w, 1 / site.original_h);
		ctx.translate(2*site.offset_x - (site.original_w - site.w), (site.original_h - site.h) - 2*site.offset_y);
		ctx.scale(site.w, site.h);
	}
}

function ctxDrawCircle (ctx, color, scale)
{
	scale = scale || 1;
	ctx.beginPath();
	ctx.arc(0, 0, 12*scale, 0, 2*Math.PI, false);
	ctx.strokeStyle = color || 'grey';
	ctx.stroke();
}

function ctxDrawPoint (ctx, color, scale)
{
	scale = scale || 1;
	ctx.beginPath();
	ctx.arc(0, 0, 12*scale, 0, 2*Math.PI, false);
	ctx.strokeStyle = color || 'blue';
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(24*scale, 0);
	ctx.strokeStyle = 'red';
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(0, 24*scale);
	ctx.strokeStyle = 'green';
	ctx.stroke();
}

function ctxDrawMesh (ctx, triangles, positions, stroke_style, fill_style)
{
	ctx.beginPath();
	for (var index = 0; index < triangles.length; )
	{
		var triangle = triangles[index++]*2;
		var x0 = positions[triangle], y0 = positions[triangle+1];
		var triangle = triangles[index++]*2;
		var x1 = positions[triangle], y1 = positions[triangle+1];
		var triangle = triangles[index++]*2;
		var x2 = positions[triangle], y2 = positions[triangle+1];
		ctx.moveTo(x0, y0);
		ctx.lineTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.lineTo(x0, y0);
	};
	if (fill_style)
	{
		ctx.fillStyle = fill_style;
		ctx.fill();
	}
	ctx.strokeStyle = stroke_style || 'grey';
	ctx.stroke();
}

function ctxDrawImageMesh (ctx, triangles, positions, texcoords, image, site, page)
{
	var site_texmatrix = new Float32Array(9);
	var site_texcoord = new Float32Array(2);
	mat3x3Identity(site_texmatrix);
	mat3x3Scale(site_texmatrix, image.width, image.height);
	mat3x3ApplyAtlasPageTexcoord(site_texmatrix, page);
	mat3x3ApplyAtlasSiteTexcoord(site_texmatrix, site);

	/// http://www.irrlicht3d.org/pivot/entry.php?id=1329
	for (var index = 0; index < triangles.length; )
	{
		var triangle = triangles[index++]*2;
		var position = positions.subarray(triangle, triangle+2);
		var x0 = position[0], y0 = position[1];
		var texcoord = mat3x3Transform(site_texmatrix, texcoords.subarray(triangle, triangle+2), site_texcoord);
		var u0 = texcoord[0], v0 = texcoord[1];

		var triangle = triangles[index++]*2;
		var position = positions.subarray(triangle, triangle+2);
		var x1 = position[0], y1 = position[1];
		var texcoord = mat3x3Transform(site_texmatrix, texcoords.subarray(triangle, triangle+2), site_texcoord);
		var u1 = texcoord[0], v1 = texcoord[1];

		var triangle = triangles[index++]*2;
		var position = positions.subarray(triangle, triangle+2);
		var x2 = position[0], y2 = position[1];
		var texcoord = mat3x3Transform(site_texmatrix, texcoords.subarray(triangle, triangle+2), site_texcoord);
		var u2 = texcoord[0], v2 = texcoord[1];

		ctx.save();
		ctx.beginPath();
		ctx.moveTo(x0, y0);
		ctx.lineTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.closePath();
		ctx.clip();
		x1 -= x0; y1 -= y0;
		x2 -= x0; y2 -= y0;
		u1 -= u0; v1 -= v0;
		u2 -= u0; v2 -= v0;
		var id = 1 / (u1*v2 - u2*v1);
		var a = id * (v2*x1 - v1*x2);
		var b = id * (v2*y1 - v1*y2);
		var c = id * (u1*x2 - u2*x1);
		var d = id * (u1*y2 - u2*y1);
		var e = x0 - (a*u0 + c*v0);
		var f = y0 - (b*u0 + d*v0);
		ctx.transform(a, b, c, d, e, f);
		ctx.drawImage(image, 0, 0);
		ctx.restore();
	}
}

function ctxDrawIkConstraints (ctx, data, bones)
{
	data.ikc_keys.forEach(function (ikc_key)
	{
		var ikc = data.ikcs[ikc_key];
		var target = bones[ikc.target_key];
		switch (ikc.bone_keys.length)
		{
		case 1:
			var bone = bones[ikc.bone_keys[0]];

			ctx.beginPath();
			ctx.moveTo(target.world_space.position.x, target.world_space.position.y);
			ctx.lineTo(bone.world_space.position.x, bone.world_space.position.y);
			ctx.strokeStyle = 'yellow';
			ctx.stroke();

			ctx.save();
			ctxApplySpace(ctx, target.world_space);
			ctxDrawCircle(ctx, 'yellow', 1.5);
			ctx.restore();

			ctx.save();
			ctxApplySpace(ctx, bone.world_space);
			ctxDrawCircle(ctx, 'yellow', 0.5);
			ctx.restore();
			break;
		case 2:
			var parent = bones[ikc.bone_keys[0]];
			var child = bones[ikc.bone_keys[1]];

			ctx.beginPath();
			ctx.moveTo(target.world_space.position.x, target.world_space.position.y);
			ctx.lineTo(child.world_space.position.x, child.world_space.position.y);
			ctx.lineTo(parent.world_space.position.x, parent.world_space.position.y);
			ctx.strokeStyle = 'yellow';
			ctx.stroke();

			ctx.save();
			ctxApplySpace(ctx, target.world_space);
			ctxDrawCircle(ctx, 'yellow', 1.5);
			ctx.restore();

			ctx.save();
			ctxApplySpace(ctx, child.world_space);
			ctxDrawCircle(ctx, 'yellow', 0.75);
			ctx.restore();

			ctx.save();
			ctxApplySpace(ctx, parent.world_space);
			ctxDrawCircle(ctx, 'yellow', 0.5);
			ctx.restore();
			break;
		}
	});
}
goog.provide('renderWebGL');

/**
 * @constructor
 * @param {WebGLRenderingContext} gl
 */
renderWebGL = function (gl)
{
	var render = this;
	render.gl = gl;
	if (!gl) { return; }
	render.gl_textures = {};
	render.gl_projection = mat3x3Identity(new Float32Array(9));
	render.gl_modelview = mat3x3Identity(new Float32Array(9));
	render.gl_modelview_stack = [];
	render.gl_tex_matrix = mat3x3Identity(new Float32Array(9));
	render.gl_color = vec4Identity(new Float32Array(4));
	var gl_mesh_shader_vs_src =
	[
		"precision mediump int;",
		"precision mediump float;",
		"uniform mat3 uProjection;",
		"uniform mat3 uModelview;",
		"uniform mat3 uTexMatrix;",
		"attribute vec2 aVertexPosition;", // [ x, y ]
		"attribute vec2 aVertexTexCoord;", // [ u, v ]
		"varying vec3 vTexCoord;",
		"void main(void) {",
		" vTexCoord = uTexMatrix * vec3(aVertexTexCoord, 1.0);",
		" gl_Position = vec4(uProjection * uModelview * vec3(aVertexPosition, 1.0), 1.0);",
		"}"
	];
	var gl_mesh_shader_fs_src =
	[
		"precision mediump int;",
		"precision mediump float;",
		"uniform sampler2D uSampler;",
		"uniform vec4 uColor;",
		"varying vec3 vTexCoord;",
		"void main(void) {",
		" gl_FragColor = uColor * texture2D(uSampler, vTexCoord.st);",
		"}"
	];
	render.gl_mesh_shader = glMakeShader(gl, gl_mesh_shader_vs_src, gl_mesh_shader_fs_src);
	render.gl_region_vertex = {};
	render.gl_region_vertex.position = glMakeVertex(gl, new Float32Array([ -1, -1,  1, -1,  1,  1, -1,  1 ]), 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW); // [ x, y ]
	render.gl_region_vertex.texcoord = glMakeVertex(gl, new Float32Array([  0,  1,  1,  1,  1,  0,  0,  0 ]), 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW); // [ u, v ]
}

/**
 * @return {void}
 * @param {spine.Pose} spriter_pose
 * @param {atlas.Data} atlas_data
 */
renderWebGL.prototype.dropPose = function (spriter_pose, atlas_data)
{
	var render = this;
	var gl = render.gl;
	if (!gl) { return; }

	for (var image_key in render.gl_textures)
	{
		var gl_texture = render.gl_textures[image_key];
		gl.deleteTexture(gl_texture); gl_texture = null;
		delete render.gl_textures[image_key];
	}

	render.gl_textures = {};
}

/**
 * @return {void}
 * @param {spine.Pose} spriter_pose
 * @param {atlas.Data} atlas_data
 * @param {Object.<string,HTMLImageElement>} images
 */
renderWebGL.prototype.loadPose = function (spriter_pose, atlas_data, images)
{
	var render = this;
	var gl = render.gl;
	if (!gl) { return; }

	if (atlas_data)
	{
		// load atlas page images
		atlas_data.pages.forEach(function (page)
		{
			if (page.format !== 'RGBA8888')
			{
				throw new Error(page.format);
			}

			var gl_min_filter = gl.NONE;
			switch (page.min_filter)
			{
			case 'Nearest': gl_min_filter = gl.NEAREST; break;
			default: case 'Linear': gl_min_filter = gl.LINEAR; break;
			case 'MipMapNearestNearest': gl_min_filter = gl.NEAREST_MIPMAP_NEAREST; break;
			case 'MipMapLinearNearest': gl_min_filter = gl.LINEAR_MIPMAP_NEAREST; break;
			case 'MipMapNearestLinear': gl_min_filter = gl.NEAREST_MIPMAP_LINEAR; break;
			case 'MipMapLinearLinear': gl_min_filter = gl.LINEAR_MIPMAP_LINEAR; break;
			}

			var gl_mag_filter = gl.NONE;
			switch (page.mag_filter)
			{
			case 'Nearest': gl_mag_filter = gl.NEAREST; break;
			default: case 'Linear': gl_mag_filter = gl.LINEAR; break;
			}

			var gl_wrap_s = gl.NONE;
			switch (page.wrap_s)
			{
			case 'Repeat': gl_wrap_s = gl.REPEAT; break;
			default: case 'ClampToEdge': gl_wrap_s = gl.CLAMP_TO_EDGE; break;
			case 'MirroredRepeat': gl_wrap_s = gl.MIRRORED_REPEAT; break;
			}

			var gl_wrap_t = gl.NONE;
			switch (page.wrap_t)
			{
			case 'Repeat': gl_wrap_t = gl.REPEAT; break;
			default: case 'ClampToEdge': gl_wrap_t = gl.CLAMP_TO_EDGE; break;
			case 'MirroredRepeat': gl_wrap_t = gl.MIRRORED_REPEAT; break;
			}

			var image_key = page.name;
			var image = images[image_key];
			var gl_texture = render.gl_textures[image_key] = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, gl_texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl_min_filter);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl_mag_filter);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl_wrap_s);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl_wrap_t);
		});
	}
	else
	{
		spriter_pose.data.folder_array.forEach(function (folder)
		{
			folder.file_array.forEach(function (file)
			{
				switch (file.type)
				{
				case 'image':
					var image_key = file.name;
					var image = images[image_key];
					var gl_texture = render.gl_textures[image_key] = gl.createTexture();
					gl.bindTexture(gl.TEXTURE_2D, gl_texture);
					gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
					break;
				}
			});
		});
	}
}

/**
 * @return {void}
 * @param {spine.Pose} spriter_pose
 * @param {atlas.Data} atlas_data
 */
renderWebGL.prototype.drawPose = function (spriter_pose, atlas_data)
{
	var render = this;
	var gl = render.gl;
	if (!gl) { return; }

	var gl_projection = render.gl_projection;
	var gl_modelview = render.gl_modelview;
	var gl_modelview_stack = render.gl_modelview_stack;
	var gl_tex_matrix = render.gl_tex_matrix;
	var gl_color = render.gl_color;

	var alpha = gl_color[3];

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	var gl_textures = render.gl_textures;

	var gl_shader = render.gl_mesh_shader;
	var gl_vertex = render.gl_region_vertex;

	spriter_pose.object_array.forEach(function (object)
	{
		switch (object.type)
		{
		case 'sprite':
			var folder = spriter_pose.data.folder_array[object.folder_index];
			if (!folder) { return; }
			var file = folder.file_array[object.file_index];
			if (!file) { return; }
			var site = atlas_data && atlas_data.sites[file.name];
			var page = site && atlas_data.pages[site.page];
			var image_key = (page && page.name) || file.name;
			var gl_texture = gl_textures[image_key];
			if (gl_texture)
			{
				gl_modelview_stack.push(mat3x3Copy(new Float32Array(9), gl_modelview));
				mat3x3ApplySpace(gl_modelview, object.world_space);
				mat3x3Scale(gl_modelview, file.width/2, file.height/2);
				mat3x3ApplyAtlasSitePosition(gl_modelview, site);
				mat3x3Identity(gl_tex_matrix);
				mat3x3ApplyAtlasPageTexcoord(gl_tex_matrix, page);
				mat3x3ApplyAtlasSiteTexcoord(gl_tex_matrix, site);
				gl_color[3] = alpha * object.alpha;
				gl.useProgram(gl_shader.program);
				gl.uniformMatrix3fv(gl_shader.uniforms['uProjection'], false, gl_projection);
				gl.uniformMatrix3fv(gl_shader.uniforms['uModelview'], false, gl_modelview);
				gl.uniformMatrix3fv(gl_shader.uniforms['uTexMatrix'], false, gl_tex_matrix);
				gl.uniform4fv(gl_shader.uniforms['uColor'], gl_color);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, gl_texture);
				gl.uniform1i(gl_shader.uniforms['uSampler'], 0);
				glSetupAttribute(gl, gl_shader, 'aVertexPosition', gl_vertex.position);
				glSetupAttribute(gl, gl_shader, 'aVertexTexCoord', gl_vertex.texcoord);
				gl.drawArrays(gl.TRIANGLE_FAN, 0, gl_vertex.position.count);
				glResetAttribute(gl, gl_shader, 'aVertexPosition', gl_vertex.position);
				glResetAttribute(gl, gl_shader, 'aVertexTexCoord', gl_vertex.texcoord);
				mat3x3Copy(gl_modelview, gl_modelview_stack.pop());
			}
			break;
		case 'entity':
			gl_modelview_stack.push(mat3x3Copy(new Float32Array(9), gl_modelview));
			mat3x3ApplySpace(gl_modelview, object.world_space);
			render.drawPose(object.pose, atlas_data); // recursive
			mat3x3Copy(gl_modelview, gl_modelview_stack.pop());
			break;
		}
	});

	gl_color[3] = alpha;
}

function vec4Identity (v)
{
	v[0] = v[1] = v[2] = v[3] = 1.0;
	return v;
}

function vec4CopyColor (v, color)
{
	v[0] = color.r;
	v[1] = color.g;
	v[2] = color.b;
	v[3] = color.a;
	return v;
}

function vec4ApplyColor (v, color)
{
	v[0] *= color.r;
	v[1] *= color.g;
	v[2] *= color.b;
	v[3] *= color.a;
	return v;
}

function mat3x3Identity (m)
{
	m[1] = m[2] = m[3] =
	m[5] = m[6] = m[7] = 0.0;
	m[0] = m[4] = m[8] = 1.0;
	return m;
}

function mat3x3Copy (m, other)
{
	m.set(other);
	return m;
}

function mat3x3Ortho (m, l, r, b, t)
{
	var lr = 1 / (l - r);
	var bt = 1 / (b - t);
	m[0] *= -2 * lr;
	m[4] *= -2 * bt;
	m[6] += (l + r) * lr;
	m[7] += (t + b) * bt;
	return m;
}

function mat3x3Translate (m, x, y)
{
	m[6] += m[0] * x + m[3] * y;
	m[7] += m[1] * x + m[4] * y;
	return m;
}

function mat3x3RotateCosSin (m, c, s)
{
	var m0 = m[0], m1 = m[1];
	var m3 = m[3], m4 = m[4];
	m[0] = m0 * c + m3 * s;
	m[1] = m1 * c + m4 * s;
	m[3] = m3 * c - m0 * s;
	m[4] = m4 * c - m1 * s;
	return m;
}

function mat3x3Rotate (m, angle)
{
	return mat3x3RotateCosSin(m, Math.cos(angle), Math.sin(angle));
}

function mat3x3Scale (m, x, y)
{
	m[0] *= x; m[1] *= x; m[2] *= x;
	m[3] *= y; m[4] *= y; m[5] *= y;
	return m;
}

function mat3x3Transform (m, v, out)
{
	var x = m[0]*v[0] + m[3]*v[1] + m[6];
	var y = m[1]*v[0] + m[4]*v[1] + m[7];
	var w = m[2]*v[0] + m[5]*v[1] + m[8];
	var iw = (w)?(1/w):(1);
	out[0] = x * iw;
	out[1] = y * iw;
	return out;
}

function mat3x3ApplySpace (m, space)
{
	if (space)
	{
		mat3x3Translate(m, space.position.x, space.position.y);
		mat3x3Rotate(m, space.rotation.rad);
		mat3x3Scale(m, space.scale.x, space.scale.y);
	}
	return m;
}

function mat3x3ApplyAtlasPageTexcoord (m, page)
{
	if (page)
	{
		mat3x3Scale(m, 1 / page.w, 1 / page.h);
	}
	return m;
}

function mat3x3ApplyAtlasSiteTexcoord (m, site)
{
	if (site)
	{
		mat3x3Translate(m, site.x, site.y);
		if (site.rotate === -1)
		{
			mat3x3Translate(m, 0, site.w); // bottom-left corner
			mat3x3RotateCosSin(m, 0, -1); // -90 degrees
		}
		else if (site.rotate === 1)
		{
			mat3x3Translate(m, site.h, 0); // top-right corner
			mat3x3RotateCosSin(m, 0, 1); // 90 degrees
		}
		mat3x3Scale(m, site.w, site.h);
	}
	return m;
}

function mat3x3ApplyAtlasSitePosition (m, site)
{
	if (site)
	{
		mat3x3Scale(m, 1 / site.original_w, 1 / site.original_h);
		mat3x3Translate(m, 2*site.offset_x - (site.original_w - site.w), (site.original_h - site.h) - 2*site.offset_y);
		mat3x3Scale(m, site.w, site.h);
	}
	return m;
}

function glCompileShader (gl, src, type)
{
	function flatten (array, out)
	{
		out = out || [];
		array.forEach(function (value)
		{
			if (Array.isArray(value)) { flatten(value, out); } else { out.push(value); }
		});
		return out;
	}
	src = flatten(src);
	var shader = gl.createShader(type);
	gl.shaderSource(shader, src.join('\n'));
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{
		src.forEach(function (line, index) { console.log(index + 1, line); });
		console.log(gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		shader = null;
	}
	return shader;
}

function glLinkProgram (gl, vs, fs)
{
	var program = gl.createProgram();
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS))
	{
		console.log("could not link shader program");
		gl.detachShader(program, vs);
		gl.detachShader(program, fs);
		gl.deleteProgram(program);
		program = null;
	}
	return program;
}

function glGetUniforms (gl, program, uniforms)
{
	var count = /** @type {number} */ (gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS));
	for (var index = 0; index < count; ++index)
	{
		var uniform = gl.getActiveUniform(program, index);
		uniforms[uniform.name] = gl.getUniformLocation(program, uniform.name);
	}
	return uniforms;
}

function glGetAttribs (gl, program, attribs)
{
	var count = /** @type {number} */ (gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES));
	for (var index = 0; index < count; ++index)
	{
		var attrib = gl.getActiveAttrib(program, index);
		attribs[attrib.name] = gl.getAttribLocation(program, attrib.name);
	}
	return attribs;
}

function glMakeShader (gl, vs_src, fs_src)
{
	var shader = {};
	shader.vs_src = vs_src;
	shader.fs_src = fs_src;
	shader.vs = glCompileShader(gl, shader.vs_src, gl.VERTEX_SHADER);
	shader.fs = glCompileShader(gl, shader.fs_src, gl.FRAGMENT_SHADER);
	shader.program = glLinkProgram(gl, shader.vs, shader.fs);
	shader.uniforms = glGetUniforms(gl, shader.program, {});
	shader.attribs = glGetAttribs(gl, shader.program, {});
	return shader;
}

function glMakeVertex (gl, type_array, size, buffer_type, buffer_draw)
{
	var vertex = {};
	if (type_array instanceof Float32Array) { vertex.type = gl.FLOAT; }
	else if (type_array instanceof Int8Array) { vertex.type = gl.BYTE; }
	else if (type_array instanceof Uint8Array) { vertex.type = gl.UNSIGNED_BYTE; }
	else if (type_array instanceof Int16Array) { vertex.type = gl.SHORT; }
	else if (type_array instanceof Uint16Array) { vertex.type = gl.UNSIGNED_SHORT; }
	else if (type_array instanceof Int32Array) { vertex.type = gl.INT; }
	else if (type_array instanceof Uint32Array) { vertex.type = gl.UNSIGNED_INT; }
	else { vertex.type = gl.NONE; throw new Error(); }
	vertex.size = size;
	vertex.count = type_array.length / vertex.size;
	vertex.type_array = type_array;
	vertex.buffer = gl.createBuffer();
	vertex.buffer_type = buffer_type;
	vertex.buffer_draw = buffer_draw;
	gl.bindBuffer(vertex.buffer_type, vertex.buffer);
	gl.bufferData(vertex.buffer_type, vertex.type_array, vertex.buffer_draw);
	return vertex;
}

function glSetupAttribute(gl, shader, format, vertex, count)
{
	count = count || 0;
	gl.bindBuffer(vertex.buffer_type, vertex.buffer);
	if (count > 0)
	{
		var sizeof_vertex = vertex.type_array.BYTES_PER_ELEMENT * vertex.size; // in bytes
		var stride = sizeof_vertex * count;
		for (var index = 0; index < count; ++index)
		{
			var offset = sizeof_vertex * index;
			var attrib = shader.attribs[format.replace(/{index}/g, index)];
			gl.vertexAttribPointer(attrib, vertex.size, vertex.type, false, stride, offset);
			gl.enableVertexAttribArray(attrib);
		}
	}
	else
	{
		var attrib = shader.attribs[format];
		gl.vertexAttribPointer(attrib, vertex.size, vertex.type, false, 0, 0);
		gl.enableVertexAttribArray(attrib);
	}
}

function glResetAttribute(gl, shader, format, vertex, count)
{
	count = count || 0;
	if (count > 0)
	{
		for (var index = 0; index < count; ++index)
		{
			var attrib = shader.attribs[format.replace(/{index}/g, index)];
			gl.disableVertexAttribArray(attrib);
		}
	}
	else
	{
		var attrib = shader.attribs[format];
		gl.disableVertexAttribArray(attrib);
	}
}
