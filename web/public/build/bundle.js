
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value' || descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next, lookup.has(block.key));
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function quintOut(t) {
        return --t * t * t * t * t + 1;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    function ie(n){return l=>{const o=Object.keys(n.$$.callbacks),i=[];return o.forEach(o=>i.push(listen(l,o,e=>bubble(n,e)))),{destroy:()=>{i.forEach(e=>e());}}}}function se(){return "undefined"!=typeof window&&!(window.CSS&&window.CSS.supports&&window.CSS.supports("(--foo: red)"))}function re(e){var t;return "r"===e.charAt(0)?e=(t=(t=e).match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i))&&4===t.length?"#"+("0"+parseInt(t[1],10).toString(16)).slice(-2)+("0"+parseInt(t[2],10).toString(16)).slice(-2)+("0"+parseInt(t[3],10).toString(16)).slice(-2):"":"transparent"===e.toLowerCase()&&(e="#00000000"),e}const{document:ae}=globals;function ce(e){let t;return {c(){t=element("div"),attr(t,"class","ripple svelte-po4fcb");},m(n,l){insert(n,t,l),e[5](t);},p:noop,i:noop,o:noop,d(n){n&&detach(t),e[5](null);}}}function de(e,t){e.style.transform=t,e.style.webkitTransform=t;}function ue(e,t){e.style.opacity=t.toString();}const pe=function(e,t){const n=["touchcancel","mouseleave","dragstart"];let l=t.currentTarget||t.target;if(l&&!l.classList.contains("ripple")&&(l=l.querySelector(".ripple")),!l)return;const o=l.dataset.event;if(o&&o!==e)return;l.dataset.event=e;const i=document.createElement("span"),{radius:s,scale:r,x:a,y:c,centerX:d,centerY:u}=((e,t)=>{const n=t.getBoundingClientRect(),l=function(e){return "TouchEvent"===e.constructor.name}(e)?e.touches[e.touches.length-1]:e,o=l.clientX-n.left,i=l.clientY-n.top;let s=0,r=.3;const a=t.dataset.center;t.dataset.circle?(r=.15,s=t.clientWidth/2,s=a?s:s+Math.sqrt((o-s)**2+(i-s)**2)/4):s=Math.sqrt(t.clientWidth**2+t.clientHeight**2)/2;const c=`${(t.clientWidth-2*s)/2}px`,d=`${(t.clientHeight-2*s)/2}px`;return {radius:s,scale:r,x:a?c:`${o-s}px`,y:a?d:`${i-s}px`,centerX:c,centerY:d}})(t,l),p=l.dataset.color,f=`${2*s}px`;i.className="animation",i.style.width=f,i.style.height=f,i.style.background=p,i.classList.add("animation--enter"),i.classList.add("animation--visible"),de(i,`translate(${a}, ${c}) scale3d(${r},${r},${r})`),ue(i,0),i.dataset.activated=String(performance.now()),l.appendChild(i),setTimeout(()=>{i.classList.remove("animation--enter"),i.classList.add("animation--in"),de(i,`translate(${d}, ${u}) scale3d(1,1,1)`),ue(i,.25);},0);const v="mousedown"===e?"mouseup":"touchend",h=function(){document.removeEventListener(v,h),n.forEach(e=>{document.removeEventListener(e,h);});const e=performance.now()-Number(i.dataset.activated),t=Math.max(250-e,0);setTimeout(()=>{i.classList.remove("animation--in"),i.classList.add("animation--out"),ue(i,0),setTimeout(()=>{i&&l.removeChild(i),0===l.children.length&&delete l.dataset.event;},300);},t);};document.addEventListener(v,h),n.forEach(e=>{document.addEventListener(e,h,{passive:!0});});},fe=function(e){0===e.button&&pe(e.type,e);},ve=function(e){if(e.changedTouches)for(let t=0;t<e.changedTouches.length;++t)pe(e.type,e.changedTouches[t]);};function he(e,t,n){let l,o,{center:i=!1}=t,{circle:s=!1}=t,{color:r="currentColor"}=t;return onMount(async()=>{await tick();try{i&&n(0,l.dataset.center="true",l),s&&n(0,l.dataset.circle="true",l),n(0,l.dataset.color=r,l),o=l.parentElement;}catch(e){}if(!o)return void console.error("Ripple: Trigger element not found.");let e=window.getComputedStyle(o);0!==e.position.length&&"static"!==e.position||(o.style.position="relative"),o.addEventListener("touchstart",ve,{passive:!0}),o.addEventListener("mousedown",fe,{passive:!0});}),onDestroy(()=>{o&&(o.removeEventListener("mousedown",fe),o.removeEventListener("touchstart",ve));}),e.$set=e=>{"center"in e&&n(1,i=e.center),"circle"in e&&n(2,s=e.circle),"color"in e&&n(3,r=e.color);},[l,i,s,r,o,function(e){binding_callbacks[e?"unshift":"push"](()=>{n(0,l=e);});}]}class ge extends SvelteComponent{constructor(e){var t;super(),ae.getElementById("svelte-po4fcb-style")||((t=element("style")).id="svelte-po4fcb-style",t.textContent=".ripple.svelte-po4fcb{display:block;position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;border-radius:inherit;color:inherit;pointer-events:none;z-index:0;contain:strict}.ripple.svelte-po4fcb .animation{color:inherit;position:absolute;top:0;left:0;border-radius:50%;opacity:0;pointer-events:none;overflow:hidden;will-change:transform, opacity}.ripple.svelte-po4fcb .animation--enter{transition:none}.ripple.svelte-po4fcb .animation--in{transition:opacity 0.1s cubic-bezier(0.4, 0, 0.2, 1);transition:transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),\n\t\t\topacity 0.1s cubic-bezier(0.4, 0, 0.2, 1)}.ripple.svelte-po4fcb .animation--out{transition:opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)}",append(ae.head,t)),init(this,e,he,ce,safe_not_equal,{center:1,circle:2,color:3});}}function me(e){let t;const n=new ge({props:{center:e[3],circle:e[3]}});return {c(){create_component(n.$$.fragment);},m(e,l){mount_component(n,e,l),t=!0;},p(e,t){const l={};8&t&&(l.center=e[3]),8&t&&(l.circle=e[3]),n.$set(l);},i(e){t||(transition_in(n.$$.fragment,e),t=!0);},o(e){transition_out(n.$$.fragment,e),t=!1;},d(e){destroy_component(n,e);}}}function be(t){let n,l,o,i,a;const d=t[22].default,p=create_slot(d,t,t[21],null);let v=t[10]&&me(t),h=[{class:t[1]},{style:t[2]},t[14]],b={};for(let e=0;e<h.length;e+=1)b=assign(b,h[e]);return {c(){n=element("button"),p&&p.c(),l=space(),v&&v.c(),set_attributes(n,b),toggle_class(n,"raised",t[6]),toggle_class(n,"outlined",t[8]&&!(t[6]||t[7])),toggle_class(n,"shaped",t[9]&&!t[3]),toggle_class(n,"dense",t[5]),toggle_class(n,"fab",t[4]&&t[3]),toggle_class(n,"icon-button",t[3]),toggle_class(n,"toggle",t[11]),toggle_class(n,"active",t[11]&&t[0]),toggle_class(n,"full-width",t[12]&&!t[3]),toggle_class(n,"svelte-6bcb3a",!0);},m(s,d){insert(s,n,d),p&&p.m(n,null),append(n,l),v&&v.m(n,null),t[23](n),i=!0,a=[listen(n,"click",t[16]),action_destroyer(o=t[15].call(null,n))];},p(e,[t]){p&&p.p&&2097152&t&&p.p(get_slot_context(d,e,e[21],null),get_slot_changes(d,e[21],t,null)),e[10]?v?(v.p(e,t),transition_in(v,1)):(v=me(e),v.c(),transition_in(v,1),v.m(n,null)):v&&(group_outros(),transition_out(v,1,1,()=>{v=null;}),check_outros()),set_attributes(n,get_spread_update(h,[2&t&&{class:e[1]},4&t&&{style:e[2]},16384&t&&e[14]])),toggle_class(n,"raised",e[6]),toggle_class(n,"outlined",e[8]&&!(e[6]||e[7])),toggle_class(n,"shaped",e[9]&&!e[3]),toggle_class(n,"dense",e[5]),toggle_class(n,"fab",e[4]&&e[3]),toggle_class(n,"icon-button",e[3]),toggle_class(n,"toggle",e[11]),toggle_class(n,"active",e[11]&&e[0]),toggle_class(n,"full-width",e[12]&&!e[3]),toggle_class(n,"svelte-6bcb3a",!0);},i(e){i||(transition_in(p,e),transition_in(v),i=!0);},o(e){transition_out(p,e),transition_out(v),i=!1;},d(e){e&&detach(n),p&&p.d(e),v&&v.d(),t[23](null),run_all(a);}}}function ye(e,t,n){const l=createEventDispatcher(),o=ie(current_component);let i,{class:s=""}=t,{style:r=null}=t,{icon:a=!1}=t,{fab:c=!1}=t,{dense:d=!1}=t,{raised:u=!1}=t,{unelevated:f=!1}=t,{outlined:v=!1}=t,{shaped:h=!1}=t,{color:g=null}=t,{ripple:m=!0}=t,{toggle:b=!1}=t,{active:x=!1}=t,{fullWidth:w=!1}=t,$={};beforeUpdate(()=>{if(!i)return;let e=i.getElementsByTagName("svg"),t=e.length;for(let n=0;n<t;n++)e[n].setAttribute("width",z+(b&&!a?2:0)),e[n].setAttribute("height",z+(b&&!a?2:0));n(13,i.style.backgroundColor=u||f?g:"transparent",i);let l=getComputedStyle(i).getPropertyValue("background-color");n(13,i.style.color=u||f?function(e="#ffffff"){let t,n,l,o,i,s;if(0===e.length&&(e="#ffffff"),e=re(e),e=String(e).replace(/[^0-9a-f]/gi,""),!new RegExp(/^(?:[0-9a-f]{3}){1,2}$/i).test(e))throw new Error("Invalid HEX color!");e.length<6&&(e=e[0]+e[0]+e[1]+e[1]+e[2]+e[2]);const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t=parseInt(r[1],16)/255,n=parseInt(r[2],16)/255,l=parseInt(r[3],16)/255,o=t<=.03928?t/12.92:Math.pow((t+.055)/1.055,2.4),i=n<=.03928?n/12.92:Math.pow((n+.055)/1.055,2.4),s=l<=.03928?l/12.92:Math.pow((l+.055)/1.055,2.4),.2126*o+.7152*i+.0722*s}(l)>.5?"#000":"#fff":g,i);});let z,{$$slots:k={},$$scope:D}=t;return e.$set=e=>{n(20,t=assign(assign({},t),exclude_internal_props(e))),"class"in e&&n(1,s=e.class),"style"in e&&n(2,r=e.style),"icon"in e&&n(3,a=e.icon),"fab"in e&&n(4,c=e.fab),"dense"in e&&n(5,d=e.dense),"raised"in e&&n(6,u=e.raised),"unelevated"in e&&n(7,f=e.unelevated),"outlined"in e&&n(8,v=e.outlined),"shaped"in e&&n(9,h=e.shaped),"color"in e&&n(17,g=e.color),"ripple"in e&&n(10,m=e.ripple),"toggle"in e&&n(11,b=e.toggle),"active"in e&&n(0,x=e.active),"fullWidth"in e&&n(12,w=e.fullWidth),"$$scope"in e&&n(21,D=e.$$scope);},e.$$.update=()=>{{const{style:e,icon:l,fab:o,dense:i,raised:s,unelevated:r,outlined:a,shaped:c,color:d,ripple:u,toggle:p,active:f,fullWidth:v,...h}=t;!h.disabled&&delete h.disabled,delete h.class,n(14,$=h);}56&e.$$.dirty&&(z=a?c?24:d?20:24:d?16:18),139264&e.$$.dirty&&("primary"===g?n(17,g=se()?"#1976d2":"var(--primary, #1976d2)"):"accent"==g?n(17,g=se()?"#f50057":"var(--accent, #f50057)"):!g&&i&&n(17,g=i.style.color||i.parentElement.style.color||(se()?"#333":"var(--color, #333)")));},t=exclude_internal_props(t),[x,s,r,a,c,d,u,f,v,h,m,b,w,i,$,o,function(e){b&&(n(0,x=!x),l("change",x));},g,z,l,t,D,k,function(e){binding_callbacks[e?"unshift":"push"](()=>{n(13,i=e);});}]}class xe extends SvelteComponent{constructor(e){var t;super(),document.getElementById("svelte-6bcb3a-style")||((t=element("style")).id="svelte-6bcb3a-style",t.textContent="button.svelte-6bcb3a:disabled{cursor:default}button.svelte-6bcb3a{cursor:pointer;font-family:Roboto, Helvetica, sans-serif;font-family:var(--button-font-family, Roboto, Helvetica, sans-serif);font-size:0.875rem;font-weight:500;letter-spacing:0.75px;text-decoration:none;text-transform:uppercase;will-change:transform, opacity;margin:0;padding:0 16px;display:-ms-inline-flexbox;display:inline-flex;position:relative;align-items:center;justify-content:center;box-sizing:border-box;height:36px;border:none;outline:none;line-height:inherit;user-select:none;overflow:hidden;vertical-align:middle;border-radius:4px}button.svelte-6bcb3a::-moz-focus-inner{border:0}button.svelte-6bcb3a:-moz-focusring{outline:none}button.svelte-6bcb3a:before{box-sizing:inherit;border-radius:inherit;color:inherit;bottom:0;content:'';left:0;opacity:0;pointer-events:none;position:absolute;right:0;top:0;transition:0.2s cubic-bezier(0.25, 0.8, 0.5, 1);will-change:background-color, opacity}.toggle.svelte-6bcb3a:before{box-sizing:content-box}.active.svelte-6bcb3a:before{background-color:currentColor;opacity:0.3}.raised.svelte-6bcb3a{box-shadow:0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14),\n\t\t\t0 1px 5px 0 rgba(0, 0, 0, 0.12)}.outlined.svelte-6bcb3a{padding:0 14px;border-style:solid;border-width:2px}.shaped.svelte-6bcb3a{border-radius:18px}.dense.svelte-6bcb3a{height:32px}.icon-button.svelte-6bcb3a{line-height:0.5;border-radius:50%;padding:8px;width:40px;height:40px;vertical-align:middle}.icon-button.outlined.svelte-6bcb3a{padding:6px}.icon-button.fab.svelte-6bcb3a{border:none;width:56px;height:56px;box-shadow:0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14),\n\t\t\t0 1px 18px 0 rgba(0, 0, 0, 0.12)}.icon-button.dense.svelte-6bcb3a{width:36px;height:36px}.icon-button.fab.dense.svelte-6bcb3a{width:40px;height:40px}.outlined.svelte-6bcb3a:not(.shaped) .ripple{border-radius:0 !important}.full-width.svelte-6bcb3a{width:100%}@media(hover: hover){button.svelte-6bcb3a:hover:not(.toggle):not([disabled]):not(.disabled):before{background-color:currentColor;opacity:0.15}button.focus-visible.svelte-6bcb3a:focus:not(.toggle):not([disabled]):not(.disabled):before{background-color:currentColor;opacity:0.3}button.focus-visible.toggle.svelte-6bcb3a:focus:not(.active):not([disabled]):not(.disabled):before{background-color:currentColor;opacity:0.15}}",append(document.head,t)),init(this,e,ye,be,safe_not_equal,{class:1,style:2,icon:3,fab:4,dense:5,raised:6,unelevated:7,outlined:8,shaped:9,color:17,ripple:10,toggle:11,active:0,fullWidth:12});}}function ke(e){let t;const n=e[13].default,l=create_slot(n,e,e[12],null);return {c(){l&&l.c();},m(e,n){l&&l.m(e,n),t=!0;},p(e,t){l&&l.p&&4096&t&&l.p(get_slot_context(n,e,e[12],null),get_slot_changes(n,e[12],t,null));},i(e){t||(transition_in(l,e),t=!0);},o(e){transition_out(l,e),t=!1;},d(e){l&&l.d(e);}}}function De(e){let t,n;return {c(){t=svg_element("svg"),n=svg_element("path"),attr(n,"d",e[1]),attr(t,"xmlns","http://www.w3.org/2000/svg"),attr(t,"viewBox",e[2]),attr(t,"class","svelte-h2unzw");},m(e,l){insert(e,t,l),append(t,n);},p(e,l){2&l&&attr(n,"d",e[1]),4&l&&attr(t,"viewBox",e[2]);},i:noop,o:noop,d(e){e&&detach(t);}}}function Ce(e){let t,n,l,o,i,r;const a=[De,ke],d=[];function p(e,t){return "string"==typeof e[1]?0:1}n=p(e),l=d[n]=a[n](e);let f=[{class:"icon "+e[0]},e[7]],v={};for(let e=0;e<f.length;e+=1)v=assign(v,f[e]);return {c(){t=element("i"),l.c(),set_attributes(t,v),toggle_class(t,"flip",e[3]&&"boolean"==typeof e[3]),toggle_class(t,"flip-h","h"===e[3]),toggle_class(t,"flip-v","v"===e[3]),toggle_class(t,"spin",e[4]),toggle_class(t,"pulse",e[5]&&!e[4]),toggle_class(t,"svelte-h2unzw",!0);},m(l,s){insert(l,t,s),d[n].m(t,null),e[14](t),i=!0,r=action_destroyer(o=e[8].call(null,t));},p(e,[o]){let i=n;n=p(e),n===i?d[n].p(e,o):(group_outros(),transition_out(d[i],1,1,()=>{d[i]=null;}),check_outros(),l=d[n],l||(l=d[n]=a[n](e),l.c()),transition_in(l,1),l.m(t,null)),set_attributes(t,get_spread_update(f,[1&o&&{class:"icon "+e[0]},128&o&&e[7]])),toggle_class(t,"flip",e[3]&&"boolean"==typeof e[3]),toggle_class(t,"flip-h","h"===e[3]),toggle_class(t,"flip-v","v"===e[3]),toggle_class(t,"spin",e[4]),toggle_class(t,"pulse",e[5]&&!e[4]),toggle_class(t,"svelte-h2unzw",!0);},i(e){i||(transition_in(l),i=!0);},o(e){transition_out(l),i=!1;},d(l){l&&detach(t),d[n].d(),e[14](null),r();}}}function Me(e,t,n){const l=ie(current_component);let o,{class:i=""}=t,{path:s=null}=t,{size:r=24}=t,{viewBox:a="0 0 24 24"}=t,{color:c="currentColor"}=t,{flip:d=!1}=t,{spin:u=!1}=t,{pulse:f=!1}=t,v={},{$$slots:h={},$$scope:g}=t;return e.$set=e=>{n(11,t=assign(assign({},t),exclude_internal_props(e))),"class"in e&&n(0,i=e.class),"path"in e&&n(1,s=e.path),"size"in e&&n(9,r=e.size),"viewBox"in e&&n(2,a=e.viewBox),"color"in e&&n(10,c=e.color),"flip"in e&&n(3,d=e.flip),"spin"in e&&n(4,u=e.spin),"pulse"in e&&n(5,f=e.pulse),"$$scope"in e&&n(12,g=e.$$scope);},e.$$.update=()=>{{const{path:e,size:l,viewBox:o,color:i,flip:s,spin:r,pulse:a,...c}=t;delete c.class,n(7,v=c);}1600&e.$$.dirty&&o&&(o.firstChild.setAttribute("width",r),o.firstChild.setAttribute("height",r),c&&o.firstChild.setAttribute("fill",c));},t=exclude_internal_props(t),[i,s,a,d,u,f,o,v,l,r,c,t,g,h,function(e){binding_callbacks[e?"unshift":"push"](()=>{n(6,o=e);});}]}class Le extends SvelteComponent{constructor(e){var t;super(),document.getElementById("svelte-h2unzw-style")||((t=element("style")).id="svelte-h2unzw-style",t.textContent=".icon.svelte-h2unzw.svelte-h2unzw{display:inline-block;position:relative;vertical-align:middle;line-height:0.5}.icon.svelte-h2unzw>svg.svelte-h2unzw{display:inline-block}.flip.svelte-h2unzw.svelte-h2unzw{transform:scale(-1, -1)}.flip-h.svelte-h2unzw.svelte-h2unzw{transform:scale(-1, 1)}.flip-v.svelte-h2unzw.svelte-h2unzw{transform:scale(1, -1)}.spin.svelte-h2unzw.svelte-h2unzw{animation:svelte-h2unzw-spin 1s 0s infinite linear}.pulse.svelte-h2unzw.svelte-h2unzw{animation:svelte-h2unzw-spin 1s infinite steps(8)}@keyframes svelte-h2unzw-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}",append(document.head,t)),init(this,e,Me,Ce,safe_not_equal,{class:0,path:1,size:9,viewBox:2,color:10,flip:3,spin:4,pulse:5});}}function Oe(e){let t;return {c(){t=element("span"),t.textContent="*",attr(t,"class","required svelte-1dzu4e7");},m(e,n){insert(e,t,n);},d(e){e&&detach(t);}}}function Pe(e){let t,n,l;return {c(){t=element("div"),n=space(),l=element("div"),attr(t,"class","input-line svelte-1dzu4e7"),attr(l,"class","focus-line svelte-1dzu4e7");},m(e,o){insert(e,t,o),insert(e,n,o),insert(e,l,o);},d(e){e&&detach(t),e&&detach(n),e&&detach(l);}}}function We(e){let t,n,l,o=(e[11]||e[10])+"";return {c(){t=element("div"),n=element("div"),l=text(o),attr(n,"class","message"),attr(t,"class","help svelte-1dzu4e7"),toggle_class(t,"persist",e[9]),toggle_class(t,"error",e[11]);},m(e,o){insert(e,t,o),append(t,n),append(n,l);},p(e,n){3072&n&&o!==(o=(e[11]||e[10])+"")&&set_data(l,o),512&n&&toggle_class(t,"persist",e[9]),2048&n&&toggle_class(t,"error",e[11]);},d(e){e&&detach(t);}}}function Xe(t){let n,l,o,i,p,f,v,h,g,m,b,k,D,C=[{class:"input"},t[12]],M={};for(let e=0;e<C.length;e+=1)M=assign(M,C[e]);let Y=t[2]&&!t[0].length&&Oe(),j=(!t[7]||t[8])&&Pe(),A=(!!t[10]||!!t[11])&&We(t);return {c(){n=element("div"),l=element("input"),i=space(),p=element("div"),f=space(),v=element("div"),h=text(t[6]),g=space(),Y&&Y.c(),m=space(),j&&j.c(),b=space(),A&&A.c(),set_attributes(l,M),toggle_class(l,"svelte-1dzu4e7",!0),attr(p,"class","focus-ring svelte-1dzu4e7"),attr(v,"class","label svelte-1dzu4e7"),attr(n,"class",k=null_to_empty(`text-field ${t[7]&&!t[8]?"outlined":"baseline"} ${t[3]}`)+" svelte-1dzu4e7"),attr(n,"style",t[4]),attr(n,"title",t[5]),toggle_class(n,"filled",t[8]),toggle_class(n,"dirty",t[13]),toggle_class(n,"disabled",t[1]);},m(s,a){insert(s,n,a),append(n,l),set_input_value(l,t[0]),append(n,i),append(n,p),append(n,f),append(n,v),append(v,h),append(v,g),Y&&Y.m(v,null),append(n,m),j&&j.m(n,null),append(n,b),A&&A.m(n,null),D=[listen(l,"input",t[19]),action_destroyer(o=t[14].call(null,l))];},p(e,[t]){set_attributes(l,get_spread_update(C,[{class:"input"},4096&t&&e[12]])),1&t&&l.value!==e[0]&&set_input_value(l,e[0]),toggle_class(l,"svelte-1dzu4e7",!0),64&t&&set_data(h,e[6]),e[2]&&!e[0].length?Y||(Y=Oe(),Y.c(),Y.m(v,null)):Y&&(Y.d(1),Y=null),!e[7]||e[8]?j||(j=Pe(),j.c(),j.m(n,b)):j&&(j.d(1),j=null),e[10]||e[11]?A?A.p(e,t):(A=We(e),A.c(),A.m(n,null)):A&&(A.d(1),A=null),392&t&&k!==(k=null_to_empty(`text-field ${e[7]&&!e[8]?"outlined":"baseline"} ${e[3]}`)+" svelte-1dzu4e7")&&attr(n,"class",k),16&t&&attr(n,"style",e[4]),32&t&&attr(n,"title",e[5]),392&t&&toggle_class(n,"filled",e[8]),8584&t&&toggle_class(n,"dirty",e[13]),394&t&&toggle_class(n,"disabled",e[1]);},i:noop,o:noop,d(e){e&&detach(n),Y&&Y.d(),j&&j.d(),A&&A.d(),run_all(D);}}}function Ve(e,t,n){const l=ie(current_component);let o,{value:i=""}=t,{disabled:s=!1}=t,{required:r=!1}=t,{class:a=""}=t,{style:c=null}=t,{title:d=null}=t,{label:u=""}=t,{outlined:p=!1}=t,{filled:f=!1}=t,{messagePersist:v=!1}=t,{message:h=""}=t,{error:g=""}=t,m={};const b=["date","datetime-local","email","month","number","password","search","tel","text","time","url","week"],x=["date","datetime-local","month","time","week"];let w;return e.$set=e=>{n(18,t=assign(assign({},t),exclude_internal_props(e))),"value"in e&&n(0,i=e.value),"disabled"in e&&n(1,s=e.disabled),"required"in e&&n(2,r=e.required),"class"in e&&n(3,a=e.class),"style"in e&&n(4,c=e.style),"title"in e&&n(5,d=e.title),"label"in e&&n(6,u=e.label),"outlined"in e&&n(7,p=e.outlined),"filled"in e&&n(8,f=e.filled),"messagePersist"in e&&n(9,v=e.messagePersist),"message"in e&&n(10,h=e.message),"error"in e&&n(11,g=e.error);},e.$$.update=()=>{{const{value:e,style:l,title:i,label:s,outlined:r,filled:a,messagePersist:c,message:d,error:u,...p}=t;!p.readonly&&delete p.readonly,!p.disabled&&delete p.disabled,delete p.class,p.type=b.indexOf(p.type)<0?"text":p.type,n(15,o=p.placeholder),n(12,m=p);}36865&e.$$.dirty&&n(13,w="string"==typeof i&&i.length>0||"number"==typeof i||o||x.indexOf(m.type)>=0);},t=exclude_internal_props(t),[i,s,r,a,c,d,u,p,f,v,h,g,m,w,l,o,b,x,t,function(){i=this.value,n(0,i);}]}class Re extends SvelteComponent{constructor(e){var t;super(),document.getElementById("svelte-1dzu4e7-style")||((t=element("style")).id="svelte-1dzu4e7-style",t.textContent=".text-field.svelte-1dzu4e7.svelte-1dzu4e7{font-family:Roboto, 'Segoe UI', sans-serif;font-weight:400;font-size:inherit;text-decoration:inherit;text-transform:inherit;box-sizing:border-box;margin:0 0 20px;position:relative;width:100%;background-color:inherit;will-change:opacity, transform, color}.outlined.svelte-1dzu4e7.svelte-1dzu4e7{margin-top:12px}.required.svelte-1dzu4e7.svelte-1dzu4e7{position:relative;top:0.175em;left:0.125em;color:#ff5252}.input.svelte-1dzu4e7.svelte-1dzu4e7{box-sizing:border-box;font:inherit;width:100%;min-height:32px;background:none;text-align:left;color:#333;color:var(--color, #333);caret-color:#1976d2;caret-color:var(--primary, #1976d2);border:none;margin:0;padding:2px 0 0;outline:none}.input.svelte-1dzu4e7.svelte-1dzu4e7::placeholder{color:rgba(0, 0, 0, 0.3755);color:var(--label, rgba(0, 0, 0, 0.3755));font-weight:100}.input.svelte-1dzu4e7.svelte-1dzu4e7::-moz-focus-inner{padding:0;border:0}.input.svelte-1dzu4e7.svelte-1dzu4e7:-moz-focusring{outline:none}.input.svelte-1dzu4e7.svelte-1dzu4e7:required{box-shadow:none}.input.svelte-1dzu4e7.svelte-1dzu4e7:invalid{box-shadow:none}.input.svelte-1dzu4e7.svelte-1dzu4e7:active{outline:none}.input:hover~.input-line.svelte-1dzu4e7.svelte-1dzu4e7{background:#333;background:var(--color, #333)}.label.svelte-1dzu4e7.svelte-1dzu4e7{font:inherit;display:inline-flex;position:absolute;left:0;top:28px;padding-right:0.2em;color:rgba(0, 0, 0, 0.3755);color:var(--label, rgba(0, 0, 0, 0.3755));background-color:inherit;pointer-events:none;-webkit-backface-visibility:hidden;backface-visibility:hidden;overflow:hidden;max-width:90%;white-space:nowrap;transform-origin:left top;transition:0.18s cubic-bezier(0.25, 0.8, 0.5, 1)}.focus-ring.svelte-1dzu4e7.svelte-1dzu4e7{pointer-events:none;margin:0;padding:0;border:2px solid transparent;border-radius:4px;position:absolute;left:0;top:0;right:0;bottom:0}.input-line.svelte-1dzu4e7.svelte-1dzu4e7{position:absolute;left:0;right:0;bottom:0;margin:0;height:1px;background:rgba(0, 0, 0, 0.3755);background:var(--label, rgba(0, 0, 0, 0.3755))}.focus-line.svelte-1dzu4e7.svelte-1dzu4e7{position:absolute;bottom:0;left:0;right:0;height:2px;-webkit-transform:scaleX(0);transform:scaleX(0);transition:transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),\n\t\t\topacity 0.18s cubic-bezier(0.4, 0, 0.2, 1),\n\t\t\t-webkit-transform 0.18s cubic-bezier(0.4, 0, 0.2, 1);transition:transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),\n\t\t\topacity 0.18s cubic-bezier(0.4, 0, 0.2, 1);opacity:0;z-index:2;background:#1976d2;background:var(--primary, #1976d2)}.help.svelte-1dzu4e7.svelte-1dzu4e7{position:absolute;left:0;right:0;bottom:-18px;display:flex;justify-content:space-between;font-size:12px;line-height:normal;letter-spacing:0.4px;color:rgba(0, 0, 0, 0.3755);color:var(--label, rgba(0, 0, 0, 0.3755));opacity:0;overflow:hidden;max-width:90%;white-space:nowrap}.persist.svelte-1dzu4e7.svelte-1dzu4e7,.error.svelte-1dzu4e7.svelte-1dzu4e7,.input:focus~.help.svelte-1dzu4e7.svelte-1dzu4e7{opacity:1}.error.svelte-1dzu4e7.svelte-1dzu4e7{color:#ff5252}.baseline.dirty.svelte-1dzu4e7 .label.svelte-1dzu4e7{letter-spacing:0.4px;top:6px;bottom:unset;font-size:13px}.baseline .input:focus~.label.svelte-1dzu4e7.svelte-1dzu4e7{letter-spacing:0.4px;top:6px;bottom:unset;font-size:13px;color:#1976d2;color:var(--primary, #1976d2)}.baseline .input:focus~.focus-line.svelte-1dzu4e7.svelte-1dzu4e7{transform:scaleX(1);opacity:1}.baseline.svelte-1dzu4e7 .input.svelte-1dzu4e7{height:52px;padding-top:22px}.baseline.filled.svelte-1dzu4e7.svelte-1dzu4e7{background:rgba(0, 0, 0, 0.0555);background:var(--bg-input-filled, rgba(0, 0, 0, 0.0555));border-radius:4px 4px 0 0}.baseline.filled.svelte-1dzu4e7 .label.svelte-1dzu4e7{background:none}.baseline.filled.svelte-1dzu4e7 .input.svelte-1dzu4e7,.baseline.filled.svelte-1dzu4e7 .label.svelte-1dzu4e7{padding-left:8px;padding-right:8px}.baseline.filled .input:focus~.label.svelte-1dzu4e7.svelte-1dzu4e7{top:6px}.baseline.filled.svelte-1dzu4e7 .help.svelte-1dzu4e7{padding-left:8px}.filled.svelte-1dzu4e7 .input.svelte-1dzu4e7:hover,.filled.svelte-1dzu4e7 .input.svelte-1dzu4e7:focus{background:rgba(0, 0, 0, 0.0555);background:var(--bg-input-filled, rgba(0, 0, 0, 0.0555))}.outlined.svelte-1dzu4e7 .help.svelte-1dzu4e7{left:18px}.outlined.svelte-1dzu4e7 .input.svelte-1dzu4e7{padding:11px 16px 9px;border-radius:4px;border:1px solid;border-color:rgba(0, 0, 0, 0.3755);border-color:var(--label, rgba(0, 0, 0, 0.3755))}.outlined.svelte-1dzu4e7 .label.svelte-1dzu4e7{top:12px;bottom:unset;left:17px}.outlined.dirty.svelte-1dzu4e7 .label.svelte-1dzu4e7{top:-6px;bottom:unset;font-size:12px;letter-spacing:0.4px;padding:0 4px;left:13px}.outlined.svelte-1dzu4e7 .input.svelte-1dzu4e7:hover{border-color:#333;border-color:var(--color, #333)}.outlined .input:focus~.label.svelte-1dzu4e7.svelte-1dzu4e7{top:-6px;bottom:unset;font-size:12px;letter-spacing:0.4px;padding:0 4px;left:13px;color:#1976d2;color:var(--primary, #1976d2)}.outlined .input:focus~.focus-ring.svelte-1dzu4e7.svelte-1dzu4e7,.outlined .input.focus-visible~.focus-ring.svelte-1dzu4e7.svelte-1dzu4e7{border-color:#1976d2;border-color:var(--primary, #1976d2)}",append(document.head,t)),init(this,e,Ve,Xe,safe_not_equal,{value:0,disabled:1,required:2,class:3,style:4,title:5,label:6,outlined:7,filled:8,messagePersist:9,message:10,error:11});}}function Ze(e,t){if("Tab"!==e.key&&9!==e.keyCode)return;let n=function(e=document){return Array.prototype.slice.call(e.querySelectorAll('button, [href], select, textarea, input:not([type="hidden"]), [tabindex]:not([tabindex="-1"])')).filter((function(e){const t=window.getComputedStyle(e);return !e.disabled&&!e.getAttribute("disabled")&&!e.classList.contains("disabled")&&"none"!==t.display&&"hidden"!==t.visibility&&t.opacity>0}))}(t);if(0===n.length)return void e.preventDefault();let l=document.activeElement,o=n.indexOf(l);e.shiftKey?o<=0&&(n[n.length-1].focus(),e.preventDefault()):o>=n.length-1&&(n[0].focus(),e.preventDefault());}const{window:Ue}=globals;function Ge(t){let n,l,o,i,r,d,p;const v=t[23].default,h=create_slot(v,t,t[22],null);return {c(){n=element("div"),h&&h.c(),attr(n,"class",l=null_to_empty("popover "+t[1])+" svelte-5k22n0"),attr(n,"style",t[2]),attr(n,"tabindex","-1");},m(l,i){insert(l,n,i),h&&h.m(n,null),t[26](n),d=!0,p=[listen(n,"introstart",t[24]),listen(n,"introend",t[25]),action_destroyer(o=t[4].call(null,n))];},p(e,t){h&&h.p&&4194304&t&&h.p(get_slot_context(v,e,e[22],null),get_slot_changes(v,e[22],t,null)),(!d||2&t&&l!==(l=null_to_empty("popover "+e[1])+" svelte-5k22n0"))&&attr(n,"class",l),(!d||4&t)&&attr(n,"style",e[2]);},i(e){d||(transition_in(h,e),add_render_callback(()=>{r&&r.end(1),i||(i=create_in_transition(n,t[5],{})),i.start();}),d=!0);},o(e){transition_out(h,e),i&&i.invalidate(),r=create_out_transition(n,t[6],{}),d=!1;},d(e){e&&detach(n),h&&h.d(e),t[26](null),e&&r&&r.end(),run_all(p);}}}function Ke(t){let n,l,o,i=t[0]&&Ge(t);return {c(){i&&i.c(),n=empty();},m(s,r){i&&i.m(s,r),insert(s,n,r),l=!0,o=[listen(Ue,"scroll",t[8],{passive:!0}),listen(Ue,"resize",t[9],{passive:!0}),listen(Ue,"keydown",t[10],!0),listen(Ue,"click",t[11])];},p(e,[t]){e[0]?i?(i.p(e,t),transition_in(i,1)):(i=Ge(e),i.c(),transition_in(i,1),i.m(n.parentNode,n)):i&&(group_outros(),transition_out(i,1,1,()=>{i=null;}),check_outros());},i(e){l||(transition_in(i),l=!0);},o(e){transition_out(i),l=!1;},d(e){i&&i.d(e),e&&detach(n),run_all(o);}}}function Je(e,t,n){const l=ie(current_component),o=createEventDispatcher();let i,s,{class:r=""}=t,{style:a=null}=t,{origin:c="top left"}=t,{dx:d=0}=t,{dy:u=0}=t,{visible:f=!1}=t,{duration:v=300}=t;async function h({target:e}){setTimeout(()=>{e.style.transitionDuration=v+"ms",e.style.transitionProperty="opacity, transform",e.style.transform="scale(1)",e.style.opacity=null;},0);}function g(e,t){let l=0;n(12,d=+d);const o=window.innerWidth-8-e;return l=l=c.indexOf("left")>=0?t.left+d:t.left+t.width-e-d,l=Math.min(o,l),l=Math.max(8,l),l}function m(e,t){let l=0;n(13,u=+u);const o=window.innerHeight-8-e;return l=l=c.indexOf("top")>=0?t.top+u:t.top+t.height-e-u,l=Math.min(o,l),l=Math.max(8,l),l}function b(){if(!f||!i||!s)return;const e=s.getBoundingClientRect();e.top<-e.height||e.top>window.innerHeight?y("overflow"):(n(3,i.style.top=m(i.offsetHeight,e)+"px",i),n(3,i.style.left=g(i.offsetWidth,e)+"px",i));}function y(e){o("close",e),n(0,f=!1);}beforeUpdate(()=>{s=i?i.parentElement:null,s&&b();});let{$$slots:x={},$$scope:w}=t;return e.$set=e=>{"class"in e&&n(1,r=e.class),"style"in e&&n(2,a=e.style),"origin"in e&&n(14,c=e.origin),"dx"in e&&n(12,d=e.dx),"dy"in e&&n(13,u=e.dy),"visible"in e&&n(0,f=e.visible),"duration"in e&&n(15,v=e.duration),"$$scope"in e&&n(22,w=e.$$scope);},[f,r,a,i,l,function(e){return e.style.transformOrigin=c,e.style.transform="scale(0.6)",e.style.opacity="0",{duration:+v}},function(e){return e.style.transformOrigin=c,e.style.transitionDuration=v+"ms",e.style.transitionProperty="opacity, transform",e.style.transform="scale(0.6)",e.style.opacity="0",{duration:+v}},h,function(){b();},function(){b();},function(e){f&&(27===e.keyCode&&(e.stopPropagation(),y("escape")),Ze(e,i));},function(e){f&&s&&!s.contains(e.target)&&y("clickOutside");},d,u,c,v,s,o,g,m,b,y,w,x,e=>h(e),e=>function({target:e}){e.style.transformOrigin=null,e.style.transitionDuration=null,e.style.transitionProperty=null,e.style.transform=null,e.focus();}(e),function(e){binding_callbacks[e?"unshift":"push"](()=>{n(3,i=e);});}]}class Qe extends SvelteComponent{constructor(e){var t;super(),document.getElementById("svelte-5k22n0-style")||((t=element("style")).id="svelte-5k22n0-style",t.textContent=".popover.svelte-5k22n0{color:#333;color:var(--color, #333);background:#fff;background:var(--bg-popover, #fff);backface-visibility:hidden;position:fixed;border-radius:2px;max-height:100%;max-width:80%;overflow:auto;outline:none;box-shadow:0 3px 3px -2px rgba(0, 0, 0, 0.2), 0 3px 4px 0 rgba(0, 0, 0, 0.14),\n\t\t\t0 1px 8px 0 rgba(0, 0, 0, 0.12);z-index:50}",append(document.head,t)),init(this,e,Je,Ke,safe_not_equal,{class:1,style:2,origin:14,dx:12,dy:13,visible:0,duration:15});}}function on(e){let t="hidden"===document.body.style.overflow;if(e&&t){let e=Math.abs(parseInt(document.body.style.top));document.body.style.cssText=null,document.body.removeAttribute("style"),window.scrollTo(0,e);}else e||t||(document.body.style.top="-"+Math.max(document.body.scrollTop,document.documentElement&&document.documentElement.scrollTop||0)+"px",document.body.style.position="fixed",document.body.style.width="100%",document.body.style.overflow="hidden");}const sn=e=>({}),rn=e=>({}),an=e=>({}),cn=e=>({}),dn=e=>({}),un=e=>({});function pn(t){let n,l,o,i,d,p,v,h,b,C,M,Y;const j=t[19].title,A=create_slot(j,t,t[18],un),N=t[19].default,B=create_slot(N,t,t[18],null),I=t[19].actions,F=create_slot(I,t,t[18],cn),q=t[19].footer,_=create_slot(q,t,t[18],rn);let H=[{class:"dialog "+t[1]},{style:`width: ${t[3]}px;${t[2]}`},{tabindex:"-1"},t[6]],O={};for(let e=0;e<H.length;e+=1)O=assign(O,H[e]);return {c(){n=element("div"),l=element("div"),o=element("div"),A&&A.c(),i=space(),d=element("div"),B&&B.c(),p=space(),F&&F.c(),v=space(),_&&_.c(),attr(o,"class","title svelte-1pkw9hl"),attr(d,"class","content svelte-1pkw9hl"),set_attributes(l,O),toggle_class(l,"svelte-1pkw9hl",!0),attr(n,"class","overlay svelte-1pkw9hl");},m(s,a){insert(s,n,a),append(n,l),append(l,o),A&&A.m(o,null),append(l,i),append(l,d),B&&B.m(d,null),append(l,p),F&&F.m(l,null),append(l,v),_&&_.m(l,null),t[21](l),M=!0,Y=[action_destroyer(h=t[8].call(null,l)),listen(l,"mousedown",stop_propagation(t[20])),listen(l,"mouseenter",t[22]),listen(n,"mousedown",t[23]),listen(n,"mouseup",t[24])];},p(e,t){A&&A.p&&262144&t&&A.p(get_slot_context(j,e,e[18],un),get_slot_changes(j,e[18],t,dn)),B&&B.p&&262144&t&&B.p(get_slot_context(N,e,e[18],null),get_slot_changes(N,e[18],t,null)),F&&F.p&&262144&t&&F.p(get_slot_context(I,e,e[18],cn),get_slot_changes(I,e[18],t,an)),_&&_.p&&262144&t&&_.p(get_slot_context(q,e,e[18],rn),get_slot_changes(q,e[18],t,sn)),set_attributes(l,get_spread_update(H,[2&t&&{class:"dialog "+e[1]},12&t&&{style:`width: ${e[3]}px;${e[2]}`},{tabindex:"-1"},64&t&&e[6]])),toggle_class(l,"svelte-1pkw9hl",!0);},i(e){M||(transition_in(A,e),transition_in(B,e),transition_in(F,e),transition_in(_,e),b||add_render_callback(()=>{b=create_in_transition(l,scale,{duration:180,opacity:.5,start:.75,easing:quintOut}),b.start();}),add_render_callback(()=>{C||(C=create_bidirectional_transition(n,fade,{duration:180},!0)),C.run(1);}),M=!0);},o(e){transition_out(A,e),transition_out(B,e),transition_out(F,e),transition_out(_,e),C||(C=create_bidirectional_transition(n,fade,{duration:180},!1)),C.run(0),M=!1;},d(e){e&&detach(n),A&&A.d(e),B&&B.d(e),F&&F.d(e),_&&_.d(e),t[21](null),e&&C&&C.end(),run_all(Y);}}}function fn(t){let n,l,o,i=t[0]&&pn(t);return {c(){i&&i.c(),n=empty();},m(s,r){i&&i.m(s,r),insert(s,n,r),l=!0,o=[listen(window,"keydown",t[10]),listen(window,"popstate",t[11])];},p(e,[t]){e[0]?i?(i.p(e,t),transition_in(i,1)):(i=pn(e),i.c(),transition_in(i,1),i.m(n.parentNode,n)):i&&(group_outros(),transition_out(i,1,1,()=>{i=null;}),check_outros());},i(e){l||(transition_in(i),l=!0);},o(e){transition_out(i),l=!1;},d(e){i&&i.d(e),e&&detach(n),run_all(o);}}}function vn(e,n,l){const o=createEventDispatcher(),i=ie(current_component);let s,{class:r=""}=n,{style:a=""}=n,{visible:c=!1}=n,{width:d=320}=n,{modal:u=!1}=n,{closeByEsc:f=!0}=n,{beforeClose:v=(()=>!0)}=n,h=!1,g={},m=!1;function b(e){v()&&(o("close",e),l(0,c=!1));}async function x(){await tick();let e=s.querySelectorAll('input:not([type="hidden"])'),t=e.length,n=0;for(;n<t&&!e[n].getAttribute("autofocus");n++);n<t?e[n].focus():t>0?e[0].focus():s.focus(),o("open");}onMount(async()=>{await tick(),l(14,m=!0);}),onDestroy(()=>{m&&on(!0);});let{$$slots:w={},$$scope:$}=n;return e.$set=e=>{l(17,n=assign(assign({},n),exclude_internal_props(e))),"class"in e&&l(1,r=e.class),"style"in e&&l(2,a=e.style),"visible"in e&&l(0,c=e.visible),"width"in e&&l(3,d=e.width),"modal"in e&&l(4,u=e.modal),"closeByEsc"in e&&l(12,f=e.closeByEsc),"beforeClose"in e&&l(13,v=e.beforeClose),"$$scope"in e&&l(18,$=e.$$scope);},e.$$.update=()=>{{const{style:e,visible:t,width:o,modal:i,closeByEsc:s,beforeClose:r,...a}=n;l(6,g=a);}16385&e.$$.dirty&&(c?(m&&on(!1),x()):(l(5,h=!1),m&&on(!0)));},n=exclude_internal_props(n),[c,r,a,d,u,h,g,s,i,b,function(e){const t="Escape";27!==e.keyCode&&e.key!==t&&e.code!==t||f&&b(t),c&&Ze(e,s);},function(){l(0,c=!1);},f,v,m,o,x,n,$,w,function(n){bubble(e,n);},function(e){binding_callbacks[e?"unshift":"push"](()=>{l(7,s=e);});},()=>{l(5,h=!1);},()=>{l(5,h=!0);},()=>{h&&!u&&b("clickOutside");}]}class hn extends SvelteComponent{constructor(e){var t;super(),document.getElementById("svelte-1pkw9hl-style")||((t=element("style")).id="svelte-1pkw9hl-style",t.textContent=".overlay.svelte-1pkw9hl{background-color:rgba(0, 0, 0, 0.5);cursor:pointer;position:fixed;left:0;top:0;right:0;bottom:0;z-index:30;display:flex;justify-content:center;align-items:center}.dialog.svelte-1pkw9hl{position:relative;font-size:1rem;background:#eee;background:var(--bg-panel, #eee);border-radius:4px;cursor:auto;box-shadow:0 11px 15px -7px rgba(0, 0, 0, 0.2), 0 24px 38px 3px rgba(0, 0, 0, 0.14),\n\t\t\t0 9px 46px 8px rgba(0, 0, 0, 0.12);z-index:40;max-height:80%;overflow-x:hidden;overflow-y:auto}.dialog.svelte-1pkw9hl:focus{outline:none}.dialog.svelte-1pkw9hl::-moz-focus-inner{border:0}.dialog.svelte-1pkw9hl:-moz-focusring{outline:none}div.svelte-1pkw9hl .actions{min-height:48px;padding:8px;display:flex;align-items:center}div.svelte-1pkw9hl .center{justify-content:center}div.svelte-1pkw9hl .left{justify-content:flex-start}div.svelte-1pkw9hl .right{justify-content:flex-end}.title.svelte-1pkw9hl{padding:16px 16px 12px;font-size:24px;line-height:36px;background:rgba(0, 0, 0, 0.1);background:var(--divider, rgba(0, 0, 0, 0.1))}.content.svelte-1pkw9hl{margin:16px}",append(document.head,t)),init(this,e,vn,fn,safe_not_equal,{class:1,style:2,visible:0,width:3,modal:4,closeByEsc:12,beforeClose:13});}}const $n=e=>({}),zn=e=>({});function kn(e){let t,n,l;const o=e[11].default,i=create_slot(o,e,e[14],null);return {c(){t=element("ul"),i&&i.c(),attr(t,"style",n=`min-width: ${e[5]}px`),attr(t,"class","svelte-1vc5q8h");},m(e,n){insert(e,t,n),i&&i.m(t,null),l=!0;},p(e,s){i&&i.p&&16384&s&&i.p(get_slot_context(o,e,e[14],null),get_slot_changes(o,e[14],s,null)),(!l||32&s&&n!==(n=`min-width: ${e[5]}px`))&&attr(t,"style",n);},i(e){l||(transition_in(i,e),l=!0);},o(e){transition_out(i,e),l=!1;},d(e){e&&detach(t),i&&i.d(e);}}}function Dn(t){let n,l,o,i,d,y,w;const $=t[11].activator,C=create_slot($,t,t[14],zn);function M(e){t[12].call(null,e);}let L={class:t[0],style:t[1],origin:t[4],dx:t[2],dy:t[3],$$slots:{default:[kn]},$$scope:{ctx:t}};void 0!==t[6]&&(L.visible=t[6]);const Y=new Qe({props:L});return binding_callbacks.push(()=>bind(Y,"visible",M)),Y.$on("click",t[10]),{c(){n=element("div"),C||(l=element("span")),C&&C.c(),o=space(),create_component(Y.$$.fragment),attr(n,"class","menu svelte-1vc5q8h");},m(i,s){insert(i,n,s),C||append(n,l),C&&C.m(n,null),append(n,o),mount_component(Y,n,null),t[13](n),y=!0,w=[listen(n,"click",t[9]),action_destroyer(d=t[8].call(null,n))];},p(e,[t]){C&&C.p&&16384&t&&C.p(get_slot_context($,e,e[14],zn),get_slot_changes($,e[14],t,$n));const n={};1&t&&(n.class=e[0]),2&t&&(n.style=e[1]),16&t&&(n.origin=e[4]),4&t&&(n.dx=e[2]),8&t&&(n.dy=e[3]),16416&t&&(n.$$scope={dirty:t,ctx:e}),!i&&64&t&&(i=!0,n.visible=e[6],add_flush_callback(()=>i=!1)),Y.$set(n);},i(e){y||(transition_in(C,e),transition_in(Y.$$.fragment,e),y=!0);},o(e){transition_out(C,e),transition_out(Y.$$.fragment,e),y=!1;},d(e){e&&detach(n),C&&C.d(e),destroy_component(Y),t[13](null),run_all(w);}}}function Cn(e,t,n){const l=ie(current_component);let o,{class:i=""}=t,{style:s=null}=t,{dx:r=0}=t,{dy:a=0}=t,{origin:c="top left"}=t,{width:d=112}=t,u=!1;let{$$slots:f={},$$scope:v}=t;return e.$set=e=>{"class"in e&&n(0,i=e.class),"style"in e&&n(1,s=e.style),"dx"in e&&n(2,r=e.dx),"dy"in e&&n(3,a=e.dy),"origin"in e&&n(4,c=e.origin),"width"in e&&n(5,d=e.width),"$$scope"in e&&n(14,v=e.$$scope);},[i,s,r,a,c,d,u,o,l,function(e){try{o.childNodes[0].contains(e.target)?n(6,u=!u):e.target===o&&n(6,u=!1);}catch(e){console.error(e);}},function(e){e.target.classList.contains("menu-item")&&n(6,u=!1);},f,function(e){u=e,n(6,u);},function(e){binding_callbacks[e?"unshift":"push"](()=>{n(7,o=e);});},v]}class Mn extends SvelteComponent{constructor(e){var t;super(),document.getElementById("svelte-1vc5q8h-style")||((t=element("style")).id="svelte-1vc5q8h-style",t.textContent="@supports (-webkit-overflow-scrolling: touch){html{cursor:pointer}}.menu.svelte-1vc5q8h{position:relative;display:inline-block;vertical-align:middle}ul.svelte-1vc5q8h{margin:0;padding:8px 0;width:100%;position:relative;overflow-x:hidden;overflow-y:visible}",append(document.head,t)),init(this,e,Cn,Dn,safe_not_equal,{class:0,style:1,dx:2,dy:3,origin:4,width:5});}}function Ln(t){let n,l,o,i,a;const d=t[10].default,p=create_slot(d,t,t[9],null);let v=t[1]&&Yn(),h=[{class:"menu-item "+t[0]},{tabindex:t[2]?"-1":"0"},t[4]],b={};for(let e=0;e<h.length;e+=1)b=assign(b,h[e]);return {c(){n=element("li"),p&&p.c(),l=space(),v&&v.c(),set_attributes(n,b),toggle_class(n,"svelte-mmrniu",!0);},m(s,d){insert(s,n,d),p&&p.m(n,null),append(n,l),v&&v.m(n,null),t[12](n),i=!0,a=[listen(n,"keydown",t[7]),action_destroyer(o=t[6].call(null,n))];},p(e,t){p&&p.p&&512&t&&p.p(get_slot_context(d,e,e[9],null),get_slot_changes(d,e[9],t,null)),e[1]?v?transition_in(v,1):(v=Yn(),v.c(),transition_in(v,1),v.m(n,null)):v&&(group_outros(),transition_out(v,1,1,()=>{v=null;}),check_outros()),set_attributes(n,get_spread_update(h,[1&t&&{class:"menu-item "+e[0]},4&t&&{tabindex:e[2]?"-1":"0"},16&t&&e[4]])),toggle_class(n,"svelte-mmrniu",!0);},i(e){i||(transition_in(p,e),transition_in(v),i=!0);},o(e){transition_out(p,e),transition_out(v),i=!1;},d(e){e&&detach(n),p&&p.d(e),v&&v.d(),t[12](null),run_all(a);}}}function En(t){let n,l,o,i,d,p;const v=t[10].default,h=create_slot(v,t,t[9],null);let b=t[1]&&jn(),Y=[{class:"menu-item "+t[0]},{href:t[3]},{tabindex:t[2]?"-1":"0"},t[4]],j={};for(let e=0;e<Y.length;e+=1)j=assign(j,Y[e]);return {c(){n=element("li"),l=element("a"),h&&h.c(),o=space(),b&&b.c(),set_attributes(l,j),toggle_class(l,"svelte-mmrniu",!0),attr(n,"class","svelte-mmrniu");},m(s,a){insert(s,n,a),append(n,l),h&&h.m(l,null),append(l,o),b&&b.m(l,null),t[11](l),d=!0,p=[listen(l,"keydown",t[7]),action_destroyer(i=t[6].call(null,l))];},p(e,t){h&&h.p&&512&t&&h.p(get_slot_context(v,e,e[9],null),get_slot_changes(v,e[9],t,null)),e[1]?b?transition_in(b,1):(b=jn(),b.c(),transition_in(b,1),b.m(l,null)):b&&(group_outros(),transition_out(b,1,1,()=>{b=null;}),check_outros()),set_attributes(l,get_spread_update(Y,[1&t&&{class:"menu-item "+e[0]},8&t&&{href:e[3]},4&t&&{tabindex:e[2]?"-1":"0"},16&t&&e[4]])),toggle_class(l,"svelte-mmrniu",!0);},i(e){d||(transition_in(h,e),transition_in(b),d=!0);},o(e){transition_out(h,e),transition_out(b),d=!1;},d(e){e&&detach(n),h&&h.d(e),b&&b.d(),t[11](null),run_all(p);}}}function Yn(e){let t;const n=new ge({});return {c(){create_component(n.$$.fragment);},m(e,l){mount_component(n,e,l),t=!0;},i(e){t||(transition_in(n.$$.fragment,e),t=!0);},o(e){transition_out(n.$$.fragment,e),t=!1;},d(e){destroy_component(n,e);}}}function jn(e){let t;const n=new ge({});return {c(){create_component(n.$$.fragment);},m(e,l){mount_component(n,e,l),t=!0;},i(e){t||(transition_in(n.$$.fragment,e),t=!0);},o(e){transition_out(n.$$.fragment,e),t=!1;},d(e){destroy_component(n,e);}}}function An(e){let t,n,l,o;const i=[En,Ln],s=[];function r(e,t){return e[3]?0:1}return t=r(e),n=s[t]=i[t](e),{c(){n.c(),l=empty();},m(e,n){s[t].m(e,n),insert(e,l,n),o=!0;},p(e,[o]){let a=t;t=r(e),t===a?s[t].p(e,o):(group_outros(),transition_out(s[a],1,1,()=>{s[a]=null;}),check_outros(),n=s[t],n||(n=s[t]=i[t](e),n.c()),transition_in(n,1),n.m(l.parentNode,l));},i(e){o||(transition_in(n),o=!0);},o(e){transition_out(n),o=!1;},d(e){s[t].d(e),e&&detach(l);}}}function Tn(e,t,n){const l=ie(current_component);let o,{class:i=""}=t,{ripple:s=!0}=t,r=!1,a=null,c={};let{$$slots:d={},$$scope:u}=t;return e.$set=e=>{n(8,t=assign(assign({},t),exclude_internal_props(e))),"class"in e&&n(0,i=e.class),"ripple"in e&&n(1,s=e.ripple),"$$scope"in e&&n(9,u=e.$$scope);},e.$$.update=()=>{{const{href:e,ripple:l,...o}=t;delete o.class,!1===o.disabled&&delete o.disabled,n(2,r=!!o.disabled),n(3,a=e&&!r?e:null),n(4,c=o);}},t=exclude_internal_props(t),[i,s,r,a,c,o,l,function(e){if(13===e.keyCode||32===e.keyCode){e.stopPropagation(),e.preventDefault();const t=new MouseEvent("click",{bubbles:!0,cancelable:!0});o.dispatchEvent(t),o.blur();}},t,u,d,function(e){binding_callbacks[e?"unshift":"push"](()=>{n(5,o=e);});},function(e){binding_callbacks[e?"unshift":"push"](()=>{n(5,o=e);});}]}class Nn extends SvelteComponent{constructor(e){var t;super(),document.getElementById("svelte-mmrniu-style")||((t=element("style")).id="svelte-mmrniu-style",t.textContent="li.svelte-mmrniu{display:block}a.svelte-mmrniu,a.svelte-mmrniu:hover{text-decoration:none}.menu-item.svelte-mmrniu{position:relative;color:inherit;cursor:pointer;height:44px;user-select:none;display:flex;align-items:center;padding:0 16px;white-space:nowrap}.menu-item.svelte-mmrniu:focus{outline:none}.menu-item.svelte-mmrniu::-moz-focus-inner{border:0}.menu-item.svelte-mmrniu:-moz-focusring{outline:none}.menu-item.svelte-mmrniu:before{background-color:currentColor;color:inherit;bottom:0;content:'';left:0;opacity:0;pointer-events:none;position:absolute;right:0;top:0;transition:0.3s cubic-bezier(0.25, 0.8, 0.5, 1)}@media(hover: hover){.menu-item.svelte-mmrniu:hover:not([disabled]):not(.disabled):before{opacity:0.15}.focus-visible.menu-item:focus:not([disabled]):not(.disabled):before{opacity:0.3}}",append(document.head,t)),init(this,e,Tn,An,safe_not_equal,{class:0,ripple:1});}}const{window:Hn}=globals;function On(t){let n,l,o,i;return {c(){n=element("div"),attr(n,"class","overlay svelte-1o2jp7l");},m(l,s){insert(l,n,s),o=!0,i=listen(n,"click",t[4]);},p:noop,i(e){o||(add_render_callback(()=>{l||(l=create_bidirectional_transition(n,fade,{duration:300},!0)),l.run(1);}),o=!0);},o(e){l||(l=create_bidirectional_transition(n,fade,{duration:300},!1)),l.run(0),o=!1;},d(e){e&&detach(n),e&&l&&l.end(),i();}}}function Pn(t){let n,l,o,i,r,d,p=t[0]&&On(t);const v=t[14].default,h=create_slot(v,t,t[13],null);return {c(){n=space(),p&&p.c(),l=space(),o=element("aside"),h&&h.c(),attr(o,"class","side-panel svelte-1o2jp7l"),attr(o,"tabindex","-1"),toggle_class(o,"left",!t[1]),toggle_class(o,"right",t[1]),toggle_class(o,"visible",t[0]);},m(s,a){insert(s,n,a),p&&p.m(s,a),insert(s,l,a),insert(s,o,a),h&&h.m(o,null),t[15](o),r=!0,d=[listen(Hn,"keydown",t[8]),listen(document.body,"touchstart",t[6]),listen(document.body,"touchend",t[7]),listen(o,"transitionend",t[5]),action_destroyer(i=t[3].call(null,o))];},p(e,[t]){e[0]?p?(p.p(e,t),transition_in(p,1)):(p=On(e),p.c(),transition_in(p,1),p.m(l.parentNode,l)):p&&(group_outros(),transition_out(p,1,1,()=>{p=null;}),check_outros()),h&&h.p&&8192&t&&h.p(get_slot_context(v,e,e[13],null),get_slot_changes(v,e[13],t,null)),2&t&&toggle_class(o,"left",!e[1]),2&t&&toggle_class(o,"right",e[1]),1&t&&toggle_class(o,"visible",e[0]);},i(e){r||(transition_in(p),transition_in(h,e),r=!0);},o(e){transition_out(p),transition_out(h,e),r=!1;},d(e){e&&detach(n),p&&p.d(e),e&&detach(l),e&&detach(o),h&&h.d(e),t[15](null),run_all(d);}}}let Wn=!1;function Xn(e,t,n){const l=ie(current_component);let o,{right:i=!1}=t,{visible:s=!1}=t,{disableScroll:r=!1}=t,a={x:null,y:null},c=!1;function d(){n(0,s=!1),setTimeout(()=>{Wn=!1;},20);}function u(){n(0,s=!0);}onMount(async()=>{await tick(),n(11,c=!0);});let{$$slots:f={},$$scope:v}=t;return e.$set=e=>{"right"in e&&n(1,i=e.right),"visible"in e&&n(0,s=e.visible),"disableScroll"in e&&n(9,r=e.disableScroll),"$$scope"in e&&n(13,v=e.$$scope);},e.$$.update=()=>{2561&e.$$.dirty&&(s?(Wn=!0,c&&r&&on(!1)):(c&&on(!0),d()));},[s,i,o,l,d,function(e){s&&"visibility"===e.propertyName&&o.focus();},function(e){a.x=e.changedTouches[0].clientX,a.y=e.changedTouches[0].clientY;},function(e){const t=e.changedTouches[0].clientX-a.x,n=e.changedTouches[0].clientY-a.y;if(Math.abs(t)>50){if(Math.abs(n)<100)if(s)(t>0&&i||t<0&&!i)&&d();else {if(Wn)return;t>0&&a.x<=20?i||u():a.x>=window.innerWidth-20&&i&&u();}}},function(e){s&&(27!==e.keyCode&&"Escape"!==e.key&&"Escape"!==e.code||d(),s&&Ze(e,o));},r,a,c,u,v,f,function(e){binding_callbacks[e?"unshift":"push"](()=>{n(2,o=e);});}]}class Vn extends SvelteComponent{constructor(e){var t;super(),document.getElementById("svelte-1o2jp7l-style")||((t=element("style")).id="svelte-1o2jp7l-style",t.textContent=".side-panel.svelte-1o2jp7l{background:#fbfbfb;background:var(--bg-color, #fbfbfb);position:fixed;visibility:hidden;width:256px;top:0;height:100%;box-shadow:0 0 10px rgba(0, 0, 0, 0.2);z-index:40;overflow-x:hidden;overflow-y:auto;transform-style:preserve-3d;will-change:transform, visibility;transition-duration:0.2s;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-property:transform, visibility}.side-panel.svelte-1o2jp7l:focus{outline:none}.side-panel.svelte-1o2jp7l::-moz-focus-inner{border:0}.side-panel.svelte-1o2jp7l:-moz-focusring{outline:none}.left.svelte-1o2jp7l{left:0;transform:translateX(-256px)}.right.svelte-1o2jp7l{left:auto;right:0;transform:translateX(256px)}.visible.svelte-1o2jp7l{visibility:visible;transform:translateX(0)}.overlay.svelte-1o2jp7l{background-color:rgba(0, 0, 0, 0.5);cursor:pointer;position:fixed;left:0;top:0;right:0;bottom:0;z-index:30}",append(document.head,t)),init(this,e,Xn,Pn,safe_not_equal,{right:1,visible:0,disableScroll:9});}}

    /* src/Include.svelte generated by Svelte v3.22.2 */
    const file = "src/Include.svelte";

    function create_fragment(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "include svelte-1a1xxqw");
    			add_location(div, file, 17, 0, 343);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			div.innerHTML = /*svgContent*/ ctx[0];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*svgContent*/ 1) div.innerHTML = /*svgContent*/ ctx[0];		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { src = null } = $$props;
    	let svgContent = "";

    	onMount(async () => {
    		$$invalidate(0, svgContent = localStorage.getItem("__data__" + src));

    		if (svgContent) ; else {
    			const res = await fetch(src);
    			$$invalidate(0, svgContent = await res.text());
    			localStorage.setItem("__data__" + src, svgContent);
    		}
    	});

    	const writable_props = ["src"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Include> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Include", $$slots, []);

    	$$self.$set = $$props => {
    		if ("src" in $$props) $$invalidate(1, src = $$props.src);
    	};

    	$$self.$capture_state = () => ({ onMount, src, svgContent });

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(1, src = $$props.src);
    		if ("svgContent" in $$props) $$invalidate(0, svgContent = $$props.svgContent);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [svgContent, src];
    }

    class Include extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { src: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Include",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get src() {
    		throw new Error("<Include>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<Include>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Account.svelte generated by Svelte v3.22.2 */
    const file$1 = "src/Account.svelte";

    function create_fragment$1(ctx) {
    	let div4;
    	let div2;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let h5;
    	let t1_value = /*account*/ ctx[0].name + "";
    	let t1;
    	let t2;
    	let div3;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			h5 = element("h5");
    			t1 = text(t1_value);
    			t2 = space();
    			div3 = element("div");
    			if (img.src !== (img_src_value = /*account*/ ctx[0].icon)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Account");
    			attr_dev(img, "class", "svelte-1iqlsez");
    			add_location(img, file$1, 25, 4, 550);
    			attr_dev(div0, "class", "image svelte-1iqlsez");
    			add_location(div0, file$1, 24, 3, 526);
    			attr_dev(h5, "class", "svelte-1iqlsez");
    			add_location(h5, file$1, 27, 3, 603);
    			attr_dev(div1, "class", "row svelte-1iqlsez");
    			add_location(div1, file$1, 23, 2, 505);
    			attr_dev(div2, "class", "card svelte-1iqlsez");
    			add_location(div2, file$1, 22, 1, 484);
    			attr_dev(div3, "class", "strength svelte-1iqlsez");
    			set_style(div3, "--force", /*account*/ ctx[0].force || 0);
    			add_location(div3, file$1, 30, 1, 645);
    			attr_dev(div4, "class", "account svelte-1iqlsez");
    			add_location(div4, file$1, 21, 0, 426);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div1, t0);
    			append_dev(div1, h5);
    			append_dev(h5, t1);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			if (remount) dispose();
    			dispose = listen_dev(div4, "click", /*click_handler*/ ctx[5], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*account*/ 1 && img.src !== (img_src_value = /*account*/ ctx[0].icon)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*account*/ 1 && t1_value !== (t1_value = /*account*/ ctx[0].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*account*/ 1) {
    				set_style(div3, "--force", /*account*/ ctx[0].force || 0);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function copyField(event) {
    	let field = event.currentTarget.getAttribute("field");
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { account } = $$props;
    	let editingFolder = false;
    	let editFolderNameElement;

    	function saveFolder() {
    		editingFolder = false;
    		dispatch("save_folder", account);
    	}

    	const writable_props = ["account"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Account> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Account", $$slots, []);
    	const click_handler = () => dispatch("click");

    	$$self.$set = $$props => {
    		if ("account" in $$props) $$invalidate(0, account = $$props.account);
    	};

    	$$self.$capture_state = () => ({
    		Include,
    		createEventDispatcher,
    		dispatch,
    		account,
    		editingFolder,
    		editFolderNameElement,
    		copyField,
    		saveFolder
    	});

    	$$self.$inject_state = $$props => {
    		if ("account" in $$props) $$invalidate(0, account = $$props.account);
    		if ("editingFolder" in $$props) editingFolder = $$props.editingFolder;
    		if ("editFolderNameElement" in $$props) editFolderNameElement = $$props.editFolderNameElement;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		account,
    		dispatch,
    		editingFolder,
    		editFolderNameElement,
    		saveFolder,
    		click_handler
    	];
    }

    class Account extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { account: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Account",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*account*/ ctx[0] === undefined && !("account" in props)) {
    			console.warn("<Account> was created without expected prop 'account'");
    		}
    	}

    	get account() {
    		throw new Error("<Account>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set account(value) {
    		throw new Error("<Account>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Field.svelte generated by Svelte v3.22.2 */
    const file$2 = "src/Field.svelte";

    // (33:0) {#if value || !readonly}
    function create_if_block(ctx) {
    	let div1;
    	let t0;
    	let div0;
    	let current_block_type_index;
    	let if_block1;
    	let t1;
    	let current_block_type_index_1;
    	let if_block2;
    	let t2;
    	let t3;
    	let show_if = parseInt(/*copy*/ ctx[6]);
    	let current;
    	let if_block0 = /*readonly*/ ctx[5] && create_if_block_12(ctx);
    	const if_block_creators = [create_if_block_8, create_else_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*readonly*/ ctx[5]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const if_block_creators_1 = [create_if_block_5, create_if_block_7];
    	const if_blocks_1 = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*type*/ ctx[1] === "password") return 0;
    		if (/*type*/ ctx[1] === "totp" && /*value*/ ctx[2]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index_1 = select_block_type_2(ctx))) {
    		if_block2 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    	}

    	let if_block3 = /*canEditType*/ ctx[7] && !/*readonly*/ ctx[5] && create_if_block_2(ctx);
    	let if_block4 = show_if && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div0 = element("div");
    			if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			if (if_block4) if_block4.c();
    			attr_dev(div0, "class", "content svelte-ub4u9f");
    			add_location(div0, file$2, 37, 4, 957);
    			attr_dev(div1, "class", "field svelte-ub4u9f");
    			add_location(div1, file$2, 33, 0, 863);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			if_blocks[current_block_type_index].m(div0, null);
    			append_dev(div0, t1);

    			if (~current_block_type_index_1) {
    				if_blocks_1[current_block_type_index_1].m(div0, null);
    			}

    			append_dev(div0, t2);
    			if (if_block3) if_block3.m(div0, null);
    			append_dev(div0, t3);
    			if (if_block4) if_block4.m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*readonly*/ ctx[5]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_12(ctx);
    					if_block0.c();
    					if_block0.m(div1, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div0, t1);
    			}

    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_2(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if (~current_block_type_index_1) {
    					if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    				}
    			} else {
    				if (if_block2) {
    					group_outros();

    					transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    						if_blocks_1[previous_block_index_1] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index_1) {
    					if_block2 = if_blocks_1[current_block_type_index_1];

    					if (!if_block2) {
    						if_block2 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    						if_block2.c();
    					}

    					transition_in(if_block2, 1);
    					if_block2.m(div0, t2);
    				} else {
    					if_block2 = null;
    				}
    			}

    			if (/*canEditType*/ ctx[7] && !/*readonly*/ ctx[5]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*canEditType, readonly*/ 160) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_2(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div0, t3);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*copy*/ 64) show_if = parseInt(/*copy*/ ctx[6]);

    			if (show_if) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty & /*copy*/ 64) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_1(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(div0, null);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if_blocks[current_block_type_index].d();

    			if (~current_block_type_index_1) {
    				if_blocks_1[current_block_type_index_1].d();
    			}

    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(33:0) {#if value || !readonly}",
    		ctx
    	});

    	return block;
    }

    // (35:4) {#if readonly}
    function create_if_block_12(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*label*/ ctx[0]);
    			attr_dev(div, "class", "label svelte-ub4u9f");
    			add_location(div, file$2, 35, 8, 910);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 1) set_data_dev(t, /*label*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(35:4) {#if readonly}",
    		ctx
    	});

    	return block;
    }

    // (49:8) {:else}
    function create_else_block_3(ctx) {
    	let updating_label;
    	let updating_value;
    	let updating_message;
    	let updating_type;
    	let current;

    	function textfield_label_binding(value) {
    		/*textfield_label_binding*/ ctx[11].call(null, value);
    	}

    	function textfield_value_binding(value) {
    		/*textfield_value_binding*/ ctx[12].call(null, value);
    	}

    	function textfield_message_binding(value) {
    		/*textfield_message_binding*/ ctx[13].call(null, value);
    	}

    	function textfield_type_binding(value) {
    		/*textfield_type_binding*/ ctx[14].call(null, value);
    	}

    	let textfield_props = { messagePersist: "1" };

    	if (/*label*/ ctx[0] !== void 0) {
    		textfield_props.label = /*label*/ ctx[0];
    	}

    	if (/*value*/ ctx[2] !== void 0) {
    		textfield_props.value = /*value*/ ctx[2];
    	}

    	if (/*message*/ ctx[3] !== void 0) {
    		textfield_props.message = /*message*/ ctx[3];
    	}

    	if (/*computedType*/ ctx[9] !== void 0) {
    		textfield_props.type = /*computedType*/ ctx[9];
    	}

    	const textfield = new Re({ props: textfield_props, $$inline: true });
    	binding_callbacks.push(() => bind(textfield, "label", textfield_label_binding));
    	binding_callbacks.push(() => bind(textfield, "value", textfield_value_binding));
    	binding_callbacks.push(() => bind(textfield, "message", textfield_message_binding));
    	binding_callbacks.push(() => bind(textfield, "type", textfield_type_binding));

    	const block = {
    		c: function create() {
    			create_component(textfield.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textfield, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const textfield_changes = {};

    			if (!updating_label && dirty & /*label*/ 1) {
    				updating_label = true;
    				textfield_changes.label = /*label*/ ctx[0];
    				add_flush_callback(() => updating_label = false);
    			}

    			if (!updating_value && dirty & /*value*/ 4) {
    				updating_value = true;
    				textfield_changes.value = /*value*/ ctx[2];
    				add_flush_callback(() => updating_value = false);
    			}

    			if (!updating_message && dirty & /*message*/ 8) {
    				updating_message = true;
    				textfield_changes.message = /*message*/ ctx[3];
    				add_flush_callback(() => updating_message = false);
    			}

    			if (!updating_type && dirty & /*computedType*/ 512) {
    				updating_type = true;
    				textfield_changes.type = /*computedType*/ ctx[9];
    				add_flush_callback(() => updating_type = false);
    			}

    			textfield.$set(textfield_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textfield, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(49:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (39:8) {#if readonly}
    function create_if_block_8(ctx) {
    	let show_if;
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (show_if == null || dirty & /*type, value*/ 6) show_if = !!(/*type*/ ctx[1] === "url" && /*value*/ ctx[2].startsWith("http"));
    		if (show_if) return create_if_block_9;
    		if (/*type*/ ctx[1] === "password" && !/*passwordVisible*/ ctx[4]) return create_if_block_10;
    		if (/*type*/ ctx[1] === "totp") return create_if_block_11;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_1(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(39:8) {#if readonly}",
    		ctx
    	});

    	return block;
    }

    // (46:12) {:else}
    function create_else_block_2(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*value*/ ctx[2]);
    			attr_dev(div, "class", "value svelte-ub4u9f");
    			add_location(div, file$2, 46, 16, 1366);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 4) set_data_dev(t, /*value*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(46:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (44:38) 
    function create_if_block_11(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*message*/ ctx[3]);
    			attr_dev(div, "class", "value svelte-ub4u9f");
    			add_location(div, file$2, 44, 16, 1295);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 8) set_data_dev(t, /*message*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(44:38) ",
    		ctx
    	});

    	return block;
    }

    // (42:62) 
    function create_if_block_10(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = `${"•••••••••"}`;
    			attr_dev(div, "class", "value svelte-ub4u9f");
    			add_location(div, file$2, 42, 16, 1200);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(42:62) ",
    		ctx
    	});

    	return block;
    }

    // (40:12) {#if type === 'url' && value.startsWith('http')}
    function create_if_block_9(ctx) {
    	let a;
    	let t;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(/*value*/ ctx[2]);
    			attr_dev(a, "class", "value svelte-ub4u9f");
    			attr_dev(a, "href", /*value*/ ctx[2]);
    			add_location(a, file$2, 40, 16, 1079);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 4) set_data_dev(t, /*value*/ ctx[2]);

    			if (dirty & /*value*/ 4) {
    				attr_dev(a, "href", /*value*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(40:12) {#if type === 'url' && value.startsWith('http')}",
    		ctx
    	});

    	return block;
    }

    // (61:43) 
    function create_if_block_7(ctx) {
    	let current;

    	const button = new xe({
    			props: {
    				$$slots: { default: [create_default_slot_18] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*click_handler_1*/ ctx[16]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(61:43) ",
    		ctx
    	});

    	return block;
    }

    // (53:8) {#if type === 'password'}
    function create_if_block_5(ctx) {
    	let current;

    	const button = new xe({
    			props: {
    				$$slots: { default: [create_default_slot_17] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*click_handler*/ ctx[15]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope, passwordVisible*/ 8388624) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(53:8) {#if type === 'password'}",
    		ctx
    	});

    	return block;
    }

    // (62:12) <Button on:click={() => {dispatch('show_qrcode')}}>
    function create_default_slot_18(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				viewBox: "0 0 1792 1792",
    				path: "M576 1152v128h-128v-128h128zm0-768v128h-128v-128h128zm768 0v128h-128v-128h128zm-1024 1023h384v-383h-384v383zm0-767h384v-384h-384v384zm768 0h384v-384h-384v384zm-256 256v640h-640v-640h640zm512 512v128h-128v-128h128zm256 0v128h-128v-128h128zm0-512v384h-384v-128h-128v384h-128v-640h384v128h128v-128h128zm-768-768v640h-640v-640h640zm768 0v640h-640v-640h640z"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_18.name,
    		type: "slot",
    		source: "(62:12) <Button on:click={() => {dispatch('show_qrcode')}}>",
    		ctx
    	});

    	return block;
    }

    // (57:16) {:else}
    function create_else_block_1(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				path: "M12 6c3.79 0 7.17 2.13 8.82 5.5-.59 1.22-1.42 2.27-2.41 3.12l1.41 1.41c1.39-1.23 2.49-2.77 3.18-4.53C21.27 7.11 17 4 12 4c-1.27 0-2.49.2-3.64.57l1.65 1.65C10.66 6.09 11.32 6 12 6zm-1.07 1.14L13 9.21c.57.25 1.03.71 1.28 1.28l2.07 2.07c.08-.34.14-.7.14-1.07C16.5 9.01 14.48 7 12 7c-.37 0-.72.05-1.07.14zM2.01 3.87l2.68 2.68C3.06 7.83 1.77 9.53 1 11.5 2.73 15.89 7 19 12 19c1.52 0 2.98-.29 4.32-.82l3.42 3.42 1.41-1.41L3.42 2.45 2.01 3.87zm7.5 7.5l2.61 2.61c-.04.01-.08.02-.12.02-1.38 0-2.5-1.12-2.5-2.5 0-.05.01-.08.01-.13zm-3.4-3.4l1.75 1.75c-.23.55-.36 1.15-.36 1.78 0 2.48 2.02 4.5 4.5 4.5.63 0 1.23-.13 1.77-.36l.98.98c-.88.24-1.8.38-2.75.38-3.79 0-7.17-2.13-8.82-5.5.7-1.43 1.72-2.61 2.93-3.53z"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(57:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (55:16) {#if passwordVisible}
    function create_if_block_6(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				path: "M12 6c3.79 0 7.17 2.13 8.82 5.5C19.17 14.87 15.79 17 12 17s-7.17-2.13-8.82-5.5C4.83 8.13 8.21 6 12 6m0-2C7 4 2.73 7.11 1 11.5 2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4zm0 5c1.38 0 2.5 1.12 2.5 2.5S13.38 14 12 14s-2.5-1.12-2.5-2.5S10.62 9 12 9m0-2c-2.48 0-4.5 2.02-4.5 4.5S9.52 16 12 16s4.5-2.02 4.5-4.5S14.48 7 12 7z"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(55:16) {#if passwordVisible}",
    		ctx
    	});

    	return block;
    }

    // (54:12) <Button on:click={() => {passwordVisible = !passwordVisible}}>
    function create_default_slot_17(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_6, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type_3(ctx, dirty) {
    		if (/*passwordVisible*/ ctx[4]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_3(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_3(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_17.name,
    		type: "slot",
    		source: "(54:12) <Button on:click={() => {passwordVisible = !passwordVisible}}>",
    		ctx
    	});

    	return block;
    }

    // (67:8) {#if canEditType && !readonly}
    function create_if_block_2(ctx) {
    	let current;

    	const menu = new Mn({
    			props: {
    				width: "10px",
    				origin: "top right",
    				$$slots: {
    					default: [create_default_slot_2],
    					activator: [create_activator_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(menu.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(menu, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const menu_changes = {};

    			if (dirty & /*$$scope, index, type*/ 8388866) {
    				menu_changes.$$scope = { dirty, ctx };
    			}

    			menu.$set(menu_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(menu, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(67:8) {#if canEditType && !readonly}",
    		ctx
    	});

    	return block;
    }

    // (77:24) {:else}
    function create_else_block(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				path: "M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(77:24) {:else}",
    		ctx
    	});

    	return block;
    }

    // (73:49) 
    function create_if_block_4(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				$$slots: { default: [create_default_slot_16] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(73:49) ",
    		ctx
    	});

    	return block;
    }

    // (71:24) {#if type === 'text'}
    function create_if_block_3(ctx) {
    	let current;

    	const icon = new Le({
    			props: { path: "M5 4v3h5.5v12h3V7H19V4z" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(71:24) {#if type === 'text'}",
    		ctx
    	});

    	return block;
    }

    // (74:28) <Icon>
    function create_default_slot_16(ctx) {
    	let svg;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M0 0h24v24H0z");
    			attr_dev(path0, "fill", "none");
    			add_location(path0, file$2, 74, 115, 3894);
    			attr_dev(path1, "d", "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z");
    			add_location(path1, file$2, 74, 152, 3931);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$2, 74, 32, 3811);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_16.name,
    		type: "slot",
    		source: "(74:28) <Icon>",
    		ctx
    	});

    	return block;
    }

    // (70:20) <Button>
    function create_default_slot_15(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_3, create_if_block_4, create_else_block];
    	const if_blocks = [];

    	function select_block_type_4(ctx, dirty) {
    		if (/*type*/ ctx[1] === "text") return 0;
    		if (/*type*/ ctx[1] === "url") return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type_4(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_4(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_15.name,
    		type: "slot",
    		source: "(70:20) <Button>",
    		ctx
    	});

    	return block;
    }

    // (69:16) <div slot="activator">
    function create_activator_slot(ctx) {
    	let div;
    	let current;

    	const button = new xe({
    			props: {
    				$$slots: { default: [create_default_slot_15] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(button.$$.fragment);
    			attr_dev(div, "slot", "activator");
    			add_location(div, file$2, 68, 16, 3529);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(button, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope, type*/ 8388610) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_activator_slot.name,
    		type: "slot",
    		source: "(69:16) <div slot=\\\"activator\\\">",
    		ctx
    	});

    	return block;
    }

    // (83:20) <Button>
    function create_default_slot_14(ctx) {
    	let current;

    	const icon = new Le({
    			props: { path: "M5 4v3h5.5v12h3V7H19V4z" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_14.name,
    		type: "slot",
    		source: "(83:20) <Button>",
    		ctx
    	});

    	return block;
    }

    // (82:16) <Menuitem on:click={() => {type = 'text'}}>
    function create_default_slot_13(ctx) {
    	let current;

    	const button = new xe({
    			props: {
    				$$slots: { default: [create_default_slot_14] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_13.name,
    		type: "slot",
    		source: "(82:16) <Menuitem on:click={() => {type = 'text'}}>",
    		ctx
    	});

    	return block;
    }

    // (88:20) <Button>
    function create_default_slot_12(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				path: "M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_12.name,
    		type: "slot",
    		source: "(88:20) <Button>",
    		ctx
    	});

    	return block;
    }

    // (87:16) <Menuitem on:click={() => {type = 'password'}}>
    function create_default_slot_11(ctx) {
    	let current;

    	const button = new xe({
    			props: {
    				$$slots: { default: [create_default_slot_12] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_11.name,
    		type: "slot",
    		source: "(87:16) <Menuitem on:click={() => {type = 'password'}}>",
    		ctx
    	});

    	return block;
    }

    // (94:24) <Icon>
    function create_default_slot_10(ctx) {
    	let svg;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M0 0h24v24H0z");
    			attr_dev(path0, "fill", "none");
    			add_location(path0, file$2, 94, 111, 5299);
    			attr_dev(path1, "d", "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z");
    			add_location(path1, file$2, 94, 148, 5336);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$2, 94, 28, 5216);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_10.name,
    		type: "slot",
    		source: "(94:24) <Icon>",
    		ctx
    	});

    	return block;
    }

    // (93:20) <Button>
    function create_default_slot_9(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				$$slots: { default: [create_default_slot_10] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(93:20) <Button>",
    		ctx
    	});

    	return block;
    }

    // (92:16) <Menuitem on:click={() => {type = 'url'}}>
    function create_default_slot_8(ctx) {
    	let current;

    	const button = new xe({
    			props: {
    				$$slots: { default: [create_default_slot_9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(92:16) <Menuitem on:click={() => {type = 'url'}}>",
    		ctx
    	});

    	return block;
    }

    // (100:20) <Button>
    function create_default_slot_7(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				path: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4z"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(100:20) <Button>",
    		ctx
    	});

    	return block;
    }

    // (99:16) <Menuitem on:click={() => {dispatch('removefield', index)}}>
    function create_default_slot_6(ctx) {
    	let current;

    	const button = new xe({
    			props: {
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(99:16) <Menuitem on:click={() => {dispatch('removefield', index)}}>",
    		ctx
    	});

    	return block;
    }

    // (106:24) <Icon>
    function create_default_slot_5(ctx) {
    	let svg;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z");
    			add_location(path0, file$2, 106, 111, 6199);
    			attr_dev(path1, "d", "M0 0h24v24H0z");
    			attr_dev(path1, "fill", "none");
    			add_location(path1, file$2, 106, 272, 6360);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$2, 106, 28, 6116);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(106:24) <Icon>",
    		ctx
    	});

    	return block;
    }

    // (105:20) <Button>
    function create_default_slot_4(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(105:20) <Button>",
    		ctx
    	});

    	return block;
    }

    // (104:16) <Menuitem on:click={() => {dispatch('edit_field_name', index)}}>
    function create_default_slot_3(ctx) {
    	let current;

    	const button = new xe({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(104:16) <Menuitem on:click={() => {dispatch('edit_field_name', index)}}>",
    		ctx
    	});

    	return block;
    }

    // (68:12) <Menu width="10px" origin="top right">
    function create_default_slot_2(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let current;

    	const menuitem0 = new Nn({
    			props: {
    				$$slots: { default: [create_default_slot_13] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	menuitem0.$on("click", /*click_handler_2*/ ctx[17]);

    	const menuitem1 = new Nn({
    			props: {
    				$$slots: { default: [create_default_slot_11] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	menuitem1.$on("click", /*click_handler_3*/ ctx[18]);

    	const menuitem2 = new Nn({
    			props: {
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	menuitem2.$on("click", /*click_handler_4*/ ctx[19]);

    	const menuitem3 = new Nn({
    			props: {
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	menuitem3.$on("click", /*click_handler_5*/ ctx[20]);

    	const menuitem4 = new Nn({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	menuitem4.$on("click", /*click_handler_6*/ ctx[21]);

    	const block = {
    		c: function create() {
    			t0 = space();
    			create_component(menuitem0.$$.fragment);
    			t1 = space();
    			create_component(menuitem1.$$.fragment);
    			t2 = space();
    			create_component(menuitem2.$$.fragment);
    			t3 = space();
    			create_component(menuitem3.$$.fragment);
    			t4 = space();
    			create_component(menuitem4.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			mount_component(menuitem0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(menuitem1, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(menuitem2, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(menuitem3, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(menuitem4, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const menuitem0_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				menuitem0_changes.$$scope = { dirty, ctx };
    			}

    			menuitem0.$set(menuitem0_changes);
    			const menuitem1_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				menuitem1_changes.$$scope = { dirty, ctx };
    			}

    			menuitem1.$set(menuitem1_changes);
    			const menuitem2_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				menuitem2_changes.$$scope = { dirty, ctx };
    			}

    			menuitem2.$set(menuitem2_changes);
    			const menuitem3_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				menuitem3_changes.$$scope = { dirty, ctx };
    			}

    			menuitem3.$set(menuitem3_changes);
    			const menuitem4_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				menuitem4_changes.$$scope = { dirty, ctx };
    			}

    			menuitem4.$set(menuitem4_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menuitem0.$$.fragment, local);
    			transition_in(menuitem1.$$.fragment, local);
    			transition_in(menuitem2.$$.fragment, local);
    			transition_in(menuitem3.$$.fragment, local);
    			transition_in(menuitem4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menuitem0.$$.fragment, local);
    			transition_out(menuitem1.$$.fragment, local);
    			transition_out(menuitem2.$$.fragment, local);
    			transition_out(menuitem3.$$.fragment, local);
    			transition_out(menuitem4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			destroy_component(menuitem0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(menuitem1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(menuitem2, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(menuitem3, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(menuitem4, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(68:12) <Menu width=\\\"10px\\\" origin=\\\"top right\\\">",
    		ctx
    	});

    	return block;
    }

    // (113:8) {#if parseInt(copy)}
    function create_if_block_1(ctx) {
    	let current;

    	const button = new xe({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*click_handler_7*/ ctx[22]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(113:8) {#if parseInt(copy)}",
    		ctx
    	});

    	return block;
    }

    // (115:16) <Icon>
    function create_default_slot_1(ctx) {
    	let svg;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M0 0h48v48h-48z");
    			attr_dev(path0, "fill", "none");
    			add_location(path0, file$2, 115, 103, 6740);
    			attr_dev(path1, "d", "M32 2h-24c-2.21 0-4 1.79-4 4v28h4v-28h24v-4zm6 8h-22c-2.21 0-4 1.79-4 4v28c0 2.21 1.79 4 4 4h22c2.21 0 4-1.79 4-4v-28c0-2.21-1.79-4-4-4zm0 32h-22v-28h22v28z");
    			add_location(path1, file$2, 115, 142, 6779);
    			attr_dev(svg, "height", "48");
    			attr_dev(svg, "viewBox", "0 0 48 48");
    			attr_dev(svg, "width", "48");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$2, 115, 20, 6657);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(115:16) <Icon>",
    		ctx
    	});

    	return block;
    }

    // (114:12) <Button on:click={() => {copyValue(value)}}>
    function create_default_slot(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(114:12) <Button on:click={() => {copyValue(value)}}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = (/*value*/ ctx[2] || !/*readonly*/ ctx[5]) && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*value*/ ctx[2] || !/*readonly*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*value, readonly*/ 36) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function copyValue(str) {
    	const el = document.createElement("textarea");

    	// clear the clipboard with space if nothing
    	el.value = str || " ";

    	document.body.appendChild(el);
    	el.select();
    	document.execCommand("copy");
    	document.body.removeChild(el);
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { label = "" } = $$props;
    	let { readonly = 0 } = $$props;
    	let { type = "text" } = $$props;
    	let { value = "" } = $$props;
    	let { message = null } = $$props;
    	let { copy = 1 } = $$props;
    	let { canEditType = false } = $$props;
    	let { index = 0 } = $$props;
    	let { passwordVisible = false } = $$props;

    	const writable_props = [
    		"label",
    		"readonly",
    		"type",
    		"value",
    		"message",
    		"copy",
    		"canEditType",
    		"index",
    		"passwordVisible"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Field> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Field", $$slots, []);

    	function textfield_label_binding(value) {
    		label = value;
    		$$invalidate(0, label);
    	}

    	function textfield_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(2, value);
    	}

    	function textfield_message_binding(value) {
    		message = value;
    		$$invalidate(3, message);
    	}

    	function textfield_type_binding(value) {
    		computedType = value;
    		(($$invalidate(9, computedType), $$invalidate(4, passwordVisible)), $$invalidate(1, type));
    	}

    	const click_handler = () => {
    		$$invalidate(4, passwordVisible = !passwordVisible);
    	};

    	const click_handler_1 = () => {
    		dispatch("show_qrcode");
    	};

    	const click_handler_2 = () => {
    		$$invalidate(1, type = "text");
    	};

    	const click_handler_3 = () => {
    		$$invalidate(1, type = "password");
    	};

    	const click_handler_4 = () => {
    		$$invalidate(1, type = "url");
    	};

    	const click_handler_5 = () => {
    		dispatch("removefield", index);
    	};

    	const click_handler_6 = () => {
    		dispatch("edit_field_name", index);
    	};

    	const click_handler_7 = () => {
    		copyValue(value);
    	};

    	$$self.$set = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("readonly" in $$props) $$invalidate(5, readonly = $$props.readonly);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("value" in $$props) $$invalidate(2, value = $$props.value);
    		if ("message" in $$props) $$invalidate(3, message = $$props.message);
    		if ("copy" in $$props) $$invalidate(6, copy = $$props.copy);
    		if ("canEditType" in $$props) $$invalidate(7, canEditType = $$props.canEditType);
    		if ("index" in $$props) $$invalidate(8, index = $$props.index);
    		if ("passwordVisible" in $$props) $$invalidate(4, passwordVisible = $$props.passwordVisible);
    	};

    	$$self.$capture_state = () => ({
    		Textfield: Re,
    		Button: xe,
    		Icon: Le,
    		Menu: Mn,
    		Menuitem: Nn,
    		createEventDispatcher,
    		dispatch,
    		label,
    		readonly,
    		type,
    		value,
    		message,
    		copy,
    		canEditType,
    		index,
    		passwordVisible,
    		copyValue,
    		computedType
    	});

    	$$self.$inject_state = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("readonly" in $$props) $$invalidate(5, readonly = $$props.readonly);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("value" in $$props) $$invalidate(2, value = $$props.value);
    		if ("message" in $$props) $$invalidate(3, message = $$props.message);
    		if ("copy" in $$props) $$invalidate(6, copy = $$props.copy);
    		if ("canEditType" in $$props) $$invalidate(7, canEditType = $$props.canEditType);
    		if ("index" in $$props) $$invalidate(8, index = $$props.index);
    		if ("passwordVisible" in $$props) $$invalidate(4, passwordVisible = $$props.passwordVisible);
    		if ("computedType" in $$props) $$invalidate(9, computedType = $$props.computedType);
    	};

    	let computedType;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*passwordVisible, type*/ 18) {
    			 $$invalidate(9, computedType = passwordVisible ? "text" : type);
    		}
    	};

    	return [
    		label,
    		type,
    		value,
    		message,
    		passwordVisible,
    		readonly,
    		copy,
    		canEditType,
    		index,
    		computedType,
    		dispatch,
    		textfield_label_binding,
    		textfield_value_binding,
    		textfield_message_binding,
    		textfield_type_binding,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7
    	];
    }

    class Field extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			label: 0,
    			readonly: 5,
    			type: 1,
    			value: 2,
    			message: 3,
    			copy: 6,
    			canEditType: 7,
    			index: 8,
    			passwordVisible: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Field",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get label() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get readonly() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set readonly(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get message() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get copy() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set copy(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get canEditType() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set canEditType(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get passwordVisible() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set passwordVisible(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ImagePicker.svelte generated by Svelte v3.22.2 */
    const file$3 = "src/ImagePicker.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (49:8) {:else}
    function create_else_block$1(ctx) {
    	let current;

    	const include = new Include({
    			props: { src: "/img/account_default.svg" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(include.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(include, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(include.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(include.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(include, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(49:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (47:8) {#if src}
    function create_if_block$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*src*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*src*/ ctx[1]);
    			attr_dev(img, "class", "svelte-eri1h");
    			add_location(img, file$3, 47, 12, 1105);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*src*/ 2 && img.src !== (img_src_value = /*src*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*src*/ 2) {
    				attr_dev(img, "alt", /*src*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(47:8) {#if src}",
    		ctx
    	});

    	return block;
    }

    // (58:12) {#each currentSrcs as src}
    function create_each_block(ctx) {
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[11](/*src*/ ctx[1], ...args);
    	}

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*src*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*src*/ ctx[1]);
    			attr_dev(img, "class", "svelte-eri1h");
    			add_location(img, file$3, 58, 16, 1527);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, img, anchor);
    			if (remount) dispose();
    			dispose = listen_dev(img, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*currentSrcs*/ 16 && img.src !== (img_src_value = /*src*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*currentSrcs*/ 16 && img_alt_value !== (img_alt_value = /*src*/ ctx[1])) {
    				attr_dev(img, "alt", img_alt_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(58:12) {#each currentSrcs as src}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div4;
    	let div0;
    	let current_block_type_index;
    	let if_block;
    	let div0_class_value;
    	let t0;
    	let div3;
    	let div1;
    	let updating_value;
    	let t1;
    	let div2;
    	let div3_class_value;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*src*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	function textfield_value_binding(value) {
    		/*textfield_value_binding*/ ctx[10].call(null, value);
    	}

    	let textfield_props = { placeholder: "Search", width: "100%" };

    	if (/*searchValue*/ ctx[5] !== void 0) {
    		textfield_props.value = /*searchValue*/ ctx[5];
    	}

    	const textfield = new Re({ props: textfield_props, $$inline: true });
    	binding_callbacks.push(() => bind(textfield, "value", textfield_value_binding));
    	textfield.$on("input", /*search*/ ctx[8]);
    	let each_value = /*currentSrcs*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			if_block.c();
    			t0 = space();
    			div3 = element("div");
    			div1 = element("div");
    			create_component(textfield.$$.fragment);
    			t1 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", div0_class_value = "" + (null_to_empty(/*readonly*/ ctx[2] ? "img readonly" : "img") + " svelte-eri1h"));
    			add_location(div0, file$3, 45, 4, 1011);
    			attr_dev(div1, "class", "search svelte-eri1h");
    			add_location(div1, file$3, 53, 8, 1302);
    			attr_dev(div2, "class", "container svelte-eri1h");
    			add_location(div2, file$3, 56, 8, 1448);

    			attr_dev(div3, "class", div3_class_value = "icons " + (/*chooseIcon*/ ctx[0] && !/*readonly*/ ctx[2]
    			? "visible"
    			: "") + " svelte-eri1h");

    			add_location(div3, file$3, 52, 4, 1231);
    			attr_dev(div4, "class", "image_picker svelte-eri1h");
    			set_style(div4, "--size", /*size*/ ctx[3]);
    			add_location(div4, file$3, 44, 0, 957);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			if_blocks[current_block_type_index].m(div0, null);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			mount_component(textfield, div1, null);
    			append_dev(div3, t1);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(div0, "click", /*open*/ ctx[6], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div0, null);
    			}

    			if (!current || dirty & /*readonly*/ 4 && div0_class_value !== (div0_class_value = "" + (null_to_empty(/*readonly*/ ctx[2] ? "img readonly" : "img") + " svelte-eri1h"))) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			const textfield_changes = {};

    			if (!updating_value && dirty & /*searchValue*/ 32) {
    				updating_value = true;
    				textfield_changes.value = /*searchValue*/ ctx[5];
    				add_flush_callback(() => updating_value = false);
    			}

    			textfield.$set(textfield_changes);

    			if (dirty & /*currentSrcs, choose*/ 144) {
    				each_value = /*currentSrcs*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!current || dirty & /*chooseIcon, readonly*/ 5 && div3_class_value !== (div3_class_value = "icons " + (/*chooseIcon*/ ctx[0] && !/*readonly*/ ctx[2]
    			? "visible"
    			: "") + " svelte-eri1h")) {
    				attr_dev(div3, "class", div3_class_value);
    			}

    			if (!current || dirty & /*size*/ 8) {
    				set_style(div4, "--size", /*size*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(textfield.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(textfield.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if_blocks[current_block_type_index].d();
    			destroy_component(textfield);
    			destroy_each(each_blocks, detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { src } = $$props;
    	let { chooseIcon = false } = $$props;
    	let { readonly = false } = $$props;
    	let { size = "100px" } = $$props;
    	let srcs = [];
    	let currentSrcs = [];
    	let searchValue = "";

    	onMount(async () => {
    		let response = await fetch("/account_icons");
    		srcs = await response.json();
    		$$invalidate(4, currentSrcs = srcs);
    	});

    	function open() {
    		$$invalidate(0, chooseIcon = readonly ? false : true);
    	}

    	function choose(isrc) {
    		search();
    		$$invalidate(5, searchValue = "");
    		$$invalidate(1, src = isrc);
    		$$invalidate(0, chooseIcon = false);
    	}

    	function search(event) {
    		if (!event || !searchValue.length) {
    			$$invalidate(4, currentSrcs = srcs);
    		} else {
    			$$invalidate(4, currentSrcs = srcs.filter(url => {
    				return url.indexOf(searchValue) > 0;
    			}));
    		}
    	}

    	const writable_props = ["src", "chooseIcon", "readonly", "size"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImagePicker> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ImagePicker", $$slots, []);

    	function textfield_value_binding(value) {
    		searchValue = value;
    		$$invalidate(5, searchValue);
    	}

    	const click_handler = src => {
    		choose(src);
    	};

    	$$self.$set = $$props => {
    		if ("src" in $$props) $$invalidate(1, src = $$props.src);
    		if ("chooseIcon" in $$props) $$invalidate(0, chooseIcon = $$props.chooseIcon);
    		if ("readonly" in $$props) $$invalidate(2, readonly = $$props.readonly);
    		if ("size" in $$props) $$invalidate(3, size = $$props.size);
    	};

    	$$self.$capture_state = () => ({
    		Textfield: Re,
    		Include,
    		onMount,
    		src,
    		chooseIcon,
    		readonly,
    		size,
    		srcs,
    		currentSrcs,
    		searchValue,
    		open,
    		choose,
    		search
    	});

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(1, src = $$props.src);
    		if ("chooseIcon" in $$props) $$invalidate(0, chooseIcon = $$props.chooseIcon);
    		if ("readonly" in $$props) $$invalidate(2, readonly = $$props.readonly);
    		if ("size" in $$props) $$invalidate(3, size = $$props.size);
    		if ("srcs" in $$props) srcs = $$props.srcs;
    		if ("currentSrcs" in $$props) $$invalidate(4, currentSrcs = $$props.currentSrcs);
    		if ("searchValue" in $$props) $$invalidate(5, searchValue = $$props.searchValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		chooseIcon,
    		src,
    		readonly,
    		size,
    		currentSrcs,
    		searchValue,
    		open,
    		choose,
    		search,
    		srcs,
    		textfield_value_binding,
    		click_handler
    	];
    }

    class ImagePicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			src: 1,
    			chooseIcon: 0,
    			readonly: 2,
    			size: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImagePicker",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*src*/ ctx[1] === undefined && !("src" in props)) {
    			console.warn("<ImagePicker> was created without expected prop 'src'");
    		}
    	}

    	get src() {
    		throw new Error("<ImagePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<ImagePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get chooseIcon() {
    		throw new Error("<ImagePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set chooseIcon(value) {
    		throw new Error("<ImagePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get readonly() {
    		throw new Error("<ImagePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set readonly(value) {
    		throw new Error("<ImagePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<ImagePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<ImagePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/AccountEditor.svelte generated by Svelte v3.22.2 */
    const file$4 = "src/AccountEditor.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[42] = list[i];
    	child_ctx[43] = list;
    	child_ctx[44] = i;
    	return child_ctx;
    }

    // (112:0) {#if account}
    function create_if_block$2(ctx) {
    	let div1;
    	let div0;
    	let updating_src;
    	let updating_readonly;
    	let t0;
    	let updating_value;
    	let updating_readonly_1;
    	let t1;
    	let updating_value_1;
    	let updating_readonly_2;
    	let t2;
    	let updating_value_2;
    	let updating_readonly_3;
    	let updating_message;
    	let t3;
    	let updating_value_3;
    	let updating_readonly_4;
    	let t4;
    	let updating_value_4;
    	let updating_readonly_5;
    	let updating_message_1;
    	let t5;
    	let t6;
    	let t7;
    	let current_block_type_index;
    	let if_block1;
    	let t8;
    	let updating_visible;
    	let t9;
    	let updating_visible_1;
    	let current;

    	function imagepicker_src_binding(value) {
    		/*imagepicker_src_binding*/ ctx[21].call(null, value);
    	}

    	function imagepicker_readonly_binding(value) {
    		/*imagepicker_readonly_binding*/ ctx[22].call(null, value);
    	}

    	let imagepicker_props = { size: "100px" };

    	if (/*account*/ ctx[0].icon !== void 0) {
    		imagepicker_props.src = /*account*/ ctx[0].icon;
    	}

    	if (/*readonly*/ ctx[1] !== void 0) {
    		imagepicker_props.readonly = /*readonly*/ ctx[1];
    	}

    	const imagepicker = new ImagePicker({ props: imagepicker_props, $$inline: true });
    	binding_callbacks.push(() => bind(imagepicker, "src", imagepicker_src_binding));
    	binding_callbacks.push(() => bind(imagepicker, "readonly", imagepicker_readonly_binding));

    	function field0_value_binding(value) {
    		/*field0_value_binding*/ ctx[23].call(null, value);
    	}

    	function field0_readonly_binding(value) {
    		/*field0_readonly_binding*/ ctx[24].call(null, value);
    	}

    	let field0_props = { label: "Name" };

    	if (/*account*/ ctx[0].name !== void 0) {
    		field0_props.value = /*account*/ ctx[0].name;
    	}

    	if (/*readonly*/ ctx[1] !== void 0) {
    		field0_props.readonly = /*readonly*/ ctx[1];
    	}

    	const field0 = new Field({ props: field0_props, $$inline: true });
    	binding_callbacks.push(() => bind(field0, "value", field0_value_binding));
    	binding_callbacks.push(() => bind(field0, "readonly", field0_readonly_binding));

    	function field1_value_binding(value) {
    		/*field1_value_binding*/ ctx[25].call(null, value);
    	}

    	function field1_readonly_binding(value) {
    		/*field1_readonly_binding*/ ctx[26].call(null, value);
    	}

    	let field1_props = { label: "Login" };

    	if (/*account*/ ctx[0].login !== void 0) {
    		field1_props.value = /*account*/ ctx[0].login;
    	}

    	if (/*readonly*/ ctx[1] !== void 0) {
    		field1_props.readonly = /*readonly*/ ctx[1];
    	}

    	const field1 = new Field({ props: field1_props, $$inline: true });
    	binding_callbacks.push(() => bind(field1, "value", field1_value_binding));
    	binding_callbacks.push(() => bind(field1, "readonly", field1_readonly_binding));

    	function field2_value_binding(value) {
    		/*field2_value_binding*/ ctx[27].call(null, value);
    	}

    	function field2_readonly_binding(value) {
    		/*field2_readonly_binding*/ ctx[28].call(null, value);
    	}

    	function field2_message_binding(value) {
    		/*field2_message_binding*/ ctx[29].call(null, value);
    	}

    	let field2_props = { label: "Password", type: "password" };

    	if (/*account*/ ctx[0].password !== void 0) {
    		field2_props.value = /*account*/ ctx[0].password;
    	}

    	if (/*readonly*/ ctx[1] !== void 0) {
    		field2_props.readonly = /*readonly*/ ctx[1];
    	}

    	if (/*passwordStrength*/ ctx[4] !== void 0) {
    		field2_props.message = /*passwordStrength*/ ctx[4];
    	}

    	const field2 = new Field({ props: field2_props, $$inline: true });
    	binding_callbacks.push(() => bind(field2, "value", field2_value_binding));
    	binding_callbacks.push(() => bind(field2, "readonly", field2_readonly_binding));
    	binding_callbacks.push(() => bind(field2, "message", field2_message_binding));

    	function field3_value_binding(value) {
    		/*field3_value_binding*/ ctx[30].call(null, value);
    	}

    	function field3_readonly_binding(value) {
    		/*field3_readonly_binding*/ ctx[31].call(null, value);
    	}

    	let field3_props = { label: "URL", type: "url" };

    	if (/*account*/ ctx[0].url !== void 0) {
    		field3_props.value = /*account*/ ctx[0].url;
    	}

    	if (/*readonly*/ ctx[1] !== void 0) {
    		field3_props.readonly = /*readonly*/ ctx[1];
    	}

    	const field3 = new Field({ props: field3_props, $$inline: true });
    	binding_callbacks.push(() => bind(field3, "value", field3_value_binding));
    	binding_callbacks.push(() => bind(field3, "readonly", field3_readonly_binding));

    	function field4_value_binding(value) {
    		/*field4_value_binding*/ ctx[32].call(null, value);
    	}

    	function field4_readonly_binding(value) {
    		/*field4_readonly_binding*/ ctx[33].call(null, value);
    	}

    	function field4_message_binding(value) {
    		/*field4_message_binding*/ ctx[34].call(null, value);
    	}

    	let field4_props = { label: "2FA", type: "totp" };

    	if (/*account*/ ctx[0].totp !== void 0) {
    		field4_props.value = /*account*/ ctx[0].totp;
    	}

    	if (/*readonly*/ ctx[1] !== void 0) {
    		field4_props.readonly = /*readonly*/ ctx[1];
    	}

    	if (/*totpMessage*/ ctx[5] !== void 0) {
    		field4_props.message = /*totpMessage*/ ctx[5];
    	}

    	const field4 = new Field({ props: field4_props, $$inline: true });
    	binding_callbacks.push(() => bind(field4, "value", field4_value_binding));
    	binding_callbacks.push(() => bind(field4, "readonly", field4_readonly_binding));
    	binding_callbacks.push(() => bind(field4, "message", field4_message_binding));
    	field4.$on("show_qrcode", /*showQrCode*/ ctx[13]);
    	let each_value = /*account*/ ctx[0].fields || [];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block0 = !/*readonly*/ ctx[1] && create_if_block_2$1(ctx);
    	const if_block_creators = [create_if_block_1$1, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*readonly*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	function dialog0_visible_binding(value) {
    		/*dialog0_visible_binding*/ ctx[39].call(null, value);
    	}

    	let dialog0_props = {
    		width: "290",
    		$$slots: {
    			default: [create_default_slot_1$1],
    			title: [create_title_slot]
    		},
    		$$scope: { ctx }
    	};

    	if (/*qrCodeVisible*/ ctx[2] !== void 0) {
    		dialog0_props.visible = /*qrCodeVisible*/ ctx[2];
    	}

    	const dialog0 = new hn({ props: dialog0_props, $$inline: true });
    	binding_callbacks.push(() => bind(dialog0, "visible", dialog0_visible_binding));

    	function dialog1_visible_binding(value) {
    		/*dialog1_visible_binding*/ ctx[41].call(null, value);
    	}

    	let dialog1_props = {
    		width: "290",
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	};

    	if (/*visibleFieldNameModal*/ ctx[6] !== void 0) {
    		dialog1_props.visible = /*visibleFieldNameModal*/ ctx[6];
    	}

    	const dialog1 = new hn({ props: dialog1_props, $$inline: true });
    	binding_callbacks.push(() => bind(dialog1, "visible", dialog1_visible_binding));

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(imagepicker.$$.fragment);
    			t0 = space();
    			create_component(field0.$$.fragment);
    			t1 = space();
    			create_component(field1.$$.fragment);
    			t2 = space();
    			create_component(field2.$$.fragment);
    			t3 = space();
    			create_component(field3.$$.fragment);
    			t4 = space();
    			create_component(field4.$$.fragment);
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			if (if_block0) if_block0.c();
    			t7 = space();
    			if_block1.c();
    			t8 = space();
    			create_component(dialog0.$$.fragment);
    			t9 = space();
    			create_component(dialog1.$$.fragment);
    			attr_dev(div0, "class", "fields svelte-vh61ty");
    			add_location(div0, file$4, 113, 4, 3097);
    			attr_dev(div1, "class", "account svelte-vh61ty");
    			add_location(div1, file$4, 112, 0, 3071);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(imagepicker, div0, null);
    			append_dev(div0, t0);
    			mount_component(field0, div0, null);
    			append_dev(div0, t1);
    			mount_component(field1, div0, null);
    			append_dev(div0, t2);
    			mount_component(field2, div0, null);
    			append_dev(div0, t3);
    			mount_component(field3, div0, null);
    			append_dev(div0, t4);
    			mount_component(field4, div0, null);
    			append_dev(div0, t5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div0, t6);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div1, t7);
    			if_blocks[current_block_type_index].m(div1, null);
    			insert_dev(target, t8, anchor);
    			mount_component(dialog0, target, anchor);
    			insert_dev(target, t9, anchor);
    			mount_component(dialog1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const imagepicker_changes = {};

    			if (!updating_src && dirty[0] & /*account*/ 1) {
    				updating_src = true;
    				imagepicker_changes.src = /*account*/ ctx[0].icon;
    				add_flush_callback(() => updating_src = false);
    			}

    			if (!updating_readonly && dirty[0] & /*readonly*/ 2) {
    				updating_readonly = true;
    				imagepicker_changes.readonly = /*readonly*/ ctx[1];
    				add_flush_callback(() => updating_readonly = false);
    			}

    			imagepicker.$set(imagepicker_changes);
    			const field0_changes = {};

    			if (!updating_value && dirty[0] & /*account*/ 1) {
    				updating_value = true;
    				field0_changes.value = /*account*/ ctx[0].name;
    				add_flush_callback(() => updating_value = false);
    			}

    			if (!updating_readonly_1 && dirty[0] & /*readonly*/ 2) {
    				updating_readonly_1 = true;
    				field0_changes.readonly = /*readonly*/ ctx[1];
    				add_flush_callback(() => updating_readonly_1 = false);
    			}

    			field0.$set(field0_changes);
    			const field1_changes = {};

    			if (!updating_value_1 && dirty[0] & /*account*/ 1) {
    				updating_value_1 = true;
    				field1_changes.value = /*account*/ ctx[0].login;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			if (!updating_readonly_2 && dirty[0] & /*readonly*/ 2) {
    				updating_readonly_2 = true;
    				field1_changes.readonly = /*readonly*/ ctx[1];
    				add_flush_callback(() => updating_readonly_2 = false);
    			}

    			field1.$set(field1_changes);
    			const field2_changes = {};

    			if (!updating_value_2 && dirty[0] & /*account*/ 1) {
    				updating_value_2 = true;
    				field2_changes.value = /*account*/ ctx[0].password;
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			if (!updating_readonly_3 && dirty[0] & /*readonly*/ 2) {
    				updating_readonly_3 = true;
    				field2_changes.readonly = /*readonly*/ ctx[1];
    				add_flush_callback(() => updating_readonly_3 = false);
    			}

    			if (!updating_message && dirty[0] & /*passwordStrength*/ 16) {
    				updating_message = true;
    				field2_changes.message = /*passwordStrength*/ ctx[4];
    				add_flush_callback(() => updating_message = false);
    			}

    			field2.$set(field2_changes);
    			const field3_changes = {};

    			if (!updating_value_3 && dirty[0] & /*account*/ 1) {
    				updating_value_3 = true;
    				field3_changes.value = /*account*/ ctx[0].url;
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			if (!updating_readonly_4 && dirty[0] & /*readonly*/ 2) {
    				updating_readonly_4 = true;
    				field3_changes.readonly = /*readonly*/ ctx[1];
    				add_flush_callback(() => updating_readonly_4 = false);
    			}

    			field3.$set(field3_changes);
    			const field4_changes = {};

    			if (!updating_value_4 && dirty[0] & /*account*/ 1) {
    				updating_value_4 = true;
    				field4_changes.value = /*account*/ ctx[0].totp;
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			if (!updating_readonly_5 && dirty[0] & /*readonly*/ 2) {
    				updating_readonly_5 = true;
    				field4_changes.readonly = /*readonly*/ ctx[1];
    				add_flush_callback(() => updating_readonly_5 = false);
    			}

    			if (!updating_message_1 && dirty[0] & /*totpMessage*/ 32) {
    				updating_message_1 = true;
    				field4_changes.message = /*totpMessage*/ ctx[5];
    				add_flush_callback(() => updating_message_1 = false);
    			}

    			field4.$set(field4_changes);

    			if (dirty[0] & /*account, readonly, removeField, editFieldName*/ 3075) {
    				each_value = /*account*/ ctx[0].fields || [];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, t6);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!/*readonly*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*readonly*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div1, null);
    			}

    			const dialog0_changes = {};

    			if (dirty[1] & /*$$scope*/ 16384) {
    				dialog0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_visible && dirty[0] & /*qrCodeVisible*/ 4) {
    				updating_visible = true;
    				dialog0_changes.visible = /*qrCodeVisible*/ ctx[2];
    				add_flush_callback(() => updating_visible = false);
    			}

    			dialog0.$set(dialog0_changes);
    			const dialog1_changes = {};

    			if (dirty[0] & /*account, editedFieldIndex*/ 9 | dirty[1] & /*$$scope*/ 16384) {
    				dialog1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_visible_1 && dirty[0] & /*visibleFieldNameModal*/ 64) {
    				updating_visible_1 = true;
    				dialog1_changes.visible = /*visibleFieldNameModal*/ ctx[6];
    				add_flush_callback(() => updating_visible_1 = false);
    			}

    			dialog1.$set(dialog1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imagepicker.$$.fragment, local);
    			transition_in(field0.$$.fragment, local);
    			transition_in(field1.$$.fragment, local);
    			transition_in(field2.$$.fragment, local);
    			transition_in(field3.$$.fragment, local);
    			transition_in(field4.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(dialog0.$$.fragment, local);
    			transition_in(dialog1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imagepicker.$$.fragment, local);
    			transition_out(field0.$$.fragment, local);
    			transition_out(field1.$$.fragment, local);
    			transition_out(field2.$$.fragment, local);
    			transition_out(field3.$$.fragment, local);
    			transition_out(field4.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(dialog0.$$.fragment, local);
    			transition_out(dialog1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(imagepicker);
    			destroy_component(field0);
    			destroy_component(field1);
    			destroy_component(field2);
    			destroy_component(field3);
    			destroy_component(field4);
    			destroy_each(each_blocks, detaching);
    			if (if_block0) if_block0.d();
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t8);
    			destroy_component(dialog0, detaching);
    			if (detaching) detach_dev(t9);
    			destroy_component(dialog1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(112:0) {#if account}",
    		ctx
    	});

    	return block;
    }

    // (124:8) {#each account.fields || [] as field, i}
    function create_each_block$1(ctx) {
    	let updating_label;
    	let updating_value;
    	let updating_readonly;
    	let updating_type;
    	let current;

    	function field_label_binding(value) {
    		/*field_label_binding*/ ctx[35].call(null, value, /*field*/ ctx[42]);
    	}

    	function field_value_binding(value) {
    		/*field_value_binding*/ ctx[36].call(null, value, /*field*/ ctx[42]);
    	}

    	function field_readonly_binding(value) {
    		/*field_readonly_binding*/ ctx[37].call(null, value);
    	}

    	function field_type_binding(value) {
    		/*field_type_binding*/ ctx[38].call(null, value, /*field*/ ctx[42]);
    	}

    	let field_props = { index: /*i*/ ctx[44], canEditType: "1" };

    	if (/*field*/ ctx[42].name !== void 0) {
    		field_props.label = /*field*/ ctx[42].name;
    	}

    	if (/*field*/ ctx[42].value !== void 0) {
    		field_props.value = /*field*/ ctx[42].value;
    	}

    	if (/*readonly*/ ctx[1] !== void 0) {
    		field_props.readonly = /*readonly*/ ctx[1];
    	}

    	if (/*field*/ ctx[42].type !== void 0) {
    		field_props.type = /*field*/ ctx[42].type;
    	}

    	const field = new Field({ props: field_props, $$inline: true });
    	binding_callbacks.push(() => bind(field, "label", field_label_binding));
    	binding_callbacks.push(() => bind(field, "value", field_value_binding));
    	binding_callbacks.push(() => bind(field, "readonly", field_readonly_binding));
    	binding_callbacks.push(() => bind(field, "type", field_type_binding));
    	field.$on("removefield", /*removeField*/ ctx[10]);
    	field.$on("edit_field_name", /*editFieldName*/ ctx[11]);

    	const block = {
    		c: function create() {
    			create_component(field.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(field, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const field_changes = {};

    			if (!updating_label && dirty[0] & /*account*/ 1) {
    				updating_label = true;
    				field_changes.label = /*field*/ ctx[42].name;
    				add_flush_callback(() => updating_label = false);
    			}

    			if (!updating_value && dirty[0] & /*account*/ 1) {
    				updating_value = true;
    				field_changes.value = /*field*/ ctx[42].value;
    				add_flush_callback(() => updating_value = false);
    			}

    			if (!updating_readonly && dirty[0] & /*readonly*/ 2) {
    				updating_readonly = true;
    				field_changes.readonly = /*readonly*/ ctx[1];
    				add_flush_callback(() => updating_readonly = false);
    			}

    			if (!updating_type && dirty[0] & /*account*/ 1) {
    				updating_type = true;
    				field_changes.type = /*field*/ ctx[42].type;
    				add_flush_callback(() => updating_type = false);
    			}

    			field.$set(field_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(field.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(field.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(field, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(124:8) {#each account.fields || [] as field, i}",
    		ctx
    	});

    	return block;
    }

    // (128:8) {#if !readonly}
    function create_if_block_2$1(ctx) {
    	let current;

    	const button = new xe({
    			props: {
    				$$slots: { default: [create_default_slot_5$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*newField*/ ctx[9]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 16384) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(128:8) {#if !readonly}",
    		ctx
    	});

    	return block;
    }

    // (129:12) <Button on:click={newField}>
    function create_default_slot_5$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("New field");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5$1.name,
    		type: "slot",
    		source: "(129:12) <Button on:click={newField}>",
    		ctx
    	});

    	return block;
    }

    // (139:4) {:else}
    function create_else_block$2(ctx) {
    	let current;

    	const button = new xe({
    			props: {
    				class: "save_account",
    				raised: true,
    				icon: true,
    				$$slots: { default: [create_default_slot_4$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*save*/ ctx[8]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 16384) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(139:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (133:4) {#if readonly}
    function create_if_block_1$1(ctx) {
    	let current;

    	const button = new xe({
    			props: {
    				class: "save_account",
    				raised: true,
    				icon: true,
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*edit*/ ctx[7]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 16384) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(133:4) {#if readonly}",
    		ctx
    	});

    	return block;
    }

    // (140:8) <Button class="save_account" raised icon on:click={save}>
    function create_default_slot_4$1(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				path: "M1 14 L5 10 L13 18 L27 4 L31 8 L13 26 z",
    				viewBox: "0 0 32 32",
    				color: "accent"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$1.name,
    		type: "slot",
    		source: "(140:8) <Button class=\\\"save_account\\\" raised icon on:click={save}>",
    		ctx
    	});

    	return block;
    }

    // (135:12) <Icon color="accent">
    function create_default_slot_3$1(ctx) {
    	let svg;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z");
    			add_location(path0, file$4, 135, 99, 4268);
    			attr_dev(path1, "d", "M0 0h24v24H0z");
    			attr_dev(path1, "fill", "none");
    			add_location(path1, file$4, 135, 260, 4429);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$4, 135, 16, 4185);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$1.name,
    		type: "slot",
    		source: "(135:12) <Icon color=\\\"accent\\\">",
    		ctx
    	});

    	return block;
    }

    // (134:8) <Button class="save_account" raised icon on:click={edit}>
    function create_default_slot_2$1(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				color: "accent",
    				$$slots: { default: [create_default_slot_3$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};

    			if (dirty[1] & /*$$scope*/ 16384) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(134:8) <Button class=\\\"save_account\\\" raised icon on:click={edit}>",
    		ctx
    	});

    	return block;
    }

    // (147:4) <div slot="title">
    function create_title_slot(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "2FA QR Code";
    			attr_dev(div, "slot", "title");
    			add_location(div, file$4, 146, 4, 4781);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_title_slot.name,
    		type: "slot",
    		source: "(147:4) <div slot=\\\"title\\\">",
    		ctx
    	});

    	return block;
    }

    // (146:0) <Dialog width="290" bind:visible={qrCodeVisible}>
    function create_default_slot_1$1(ctx) {
    	let t0;
    	let p;
    	let t2;
    	let canvas;

    	const block = {
    		c: function create() {
    			t0 = space();
    			p = element("p");
    			p.textContent = "Scan this QR Code with Google Authenticator, FreeOTP...";
    			t2 = space();
    			canvas = element("canvas");
    			add_location(p, file$4, 147, 4, 4821);
    			attr_dev(canvas, "id", "qr_code_canvas");
    			attr_dev(canvas, "class", "svelte-vh61ty");
    			add_location(canvas, file$4, 148, 4, 4888);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, canvas, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(canvas);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(146:0) <Dialog width=\\\"290\\\" bind:visible={qrCodeVisible}>",
    		ctx
    	});

    	return block;
    }

    // (152:0) <Dialog width="290" bind:visible={visibleFieldNameModal}>
    function create_default_slot$1(ctx) {
    	let updating_value;
    	let current;

    	function textfield_value_binding(value) {
    		/*textfield_value_binding*/ ctx[40].call(null, value);
    	}

    	let textfield_props = { label: "Label" };

    	if (/*account*/ ctx[0].fields[/*editedFieldIndex*/ ctx[3]].name !== void 0) {
    		textfield_props.value = /*account*/ ctx[0].fields[/*editedFieldIndex*/ ctx[3]].name;
    	}

    	const textfield = new Re({ props: textfield_props, $$inline: true });
    	binding_callbacks.push(() => bind(textfield, "value", textfield_value_binding));
    	textfield.$on("keypress", /*onKeyPressFieldLabel*/ ctx[12]);

    	const block = {
    		c: function create() {
    			create_component(textfield.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textfield, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const textfield_changes = {};

    			if (!updating_value && dirty[0] & /*account, editedFieldIndex*/ 9) {
    				updating_value = true;
    				textfield_changes.value = /*account*/ ctx[0].fields[/*editedFieldIndex*/ ctx[3]].name;
    				add_flush_callback(() => updating_value = false);
    			}

    			textfield.$set(textfield_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textfield, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(152:0) <Dialog width=\\\"290\\\" bind:visible={visibleFieldNameModal}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*account*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*account*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*account*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { account = null } = $$props;
    	let { readonly = 0 } = $$props;
    	let totpCode = null;
    	let qrCodeVisible = false;
    	let time = 30;
    	let editedFieldIndex = -1;

    	async function updateTotp() {
    		let timestamp = Math.floor(Date.now() / 1000);

    		if (account && account.totp && account.totp.length) {
    			if (timestamp % 30 === 0 || !totpCode) {
    				let response = await fetch("/totp?code=" + encodeURIComponent(account.totp));

    				if (response.ok) {
    					$$invalidate(17, totpCode = await response.text());
    				}
    			}
    		}

    		$$invalidate(18, time = 30 - timestamp % 30);
    		setTimeout(updateTotp, 1000);
    	}

    	updateTotp();

    	function edit(accountEdited) {
    		$$invalidate(1, readonly = 0);
    		$$invalidate(2, qrCodeVisible = false);
    		$$invalidate(17, totpCode = null);
    	}

    	function save() {
    		dispatch("save_account", { account });
    		$$invalidate(1, readonly = 1);
    		$$invalidate(2, qrCodeVisible = false);
    		$$invalidate(17, totpCode = null);
    	}

    	function editAccount(accountEdited, read = true) {
    		$$invalidate(1, readonly = 1);
    		$$invalidate(0, account = JSON.parse(JSON.stringify(accountEdited)));
    		
    	}

    	function newAccount(newAccount) {
    		$$invalidate(1, readonly = 0);
    		$$invalidate(2, qrCodeVisible = false);
    		$$invalidate(17, totpCode = null);
    		$$invalidate(0, account = newAccount);
    	}

    	function newField() {
    		if (!account.fields) {
    			$$invalidate(0, account.fields = [], account);
    		}

    		$$invalidate(0, account.fields = account.fields.concat({ name: "Field", type: "text", value: "" }), account);
    	}

    	function removeField(event) {
    		let index = event.detail;
    		account.fields.splice(index, 1);
    		$$invalidate(0, account);
    	}

    	function editFieldName(event) {
    		$$invalidate(3, editedFieldIndex = event.detail);
    	}

    	function onKeyPressFieldLabel(e) {
    		if (!e) e = window.event;

    		if ((e.keyCode || e.which) == 13) {
    			$$invalidate(3, editedFieldIndex = -1);
    			return false;
    		}
    	}

    	function reset() {
    		$$invalidate(0, account = null);
    		$$invalidate(2, qrCodeVisible = false);
    		$$invalidate(17, totpCode = null);
    	}

    	async function showQrCode() {
    		$$invalidate(2, qrCodeVisible = true);

    		setTimeout(() => {
    			var qr = new QRious({
    					element: document.getElementById("qr_code_canvas"),
    					value: "otpauth://totp/" + encodeURIComponent(account.name) + ":" + encodeURIComponent(account.login) + "?secret=" + encodeURIComponent(account.totp) + "&issuer=" + encodeURIComponent(account.name)
    				});
    		});
    	}

    	const writable_props = ["account", "readonly"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AccountEditor> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("AccountEditor", $$slots, []);

    	function imagepicker_src_binding(value) {
    		account.icon = value;
    		$$invalidate(0, account);
    	}

    	function imagepicker_readonly_binding(value) {
    		readonly = value;
    		$$invalidate(1, readonly);
    	}

    	function field0_value_binding(value) {
    		account.name = value;
    		$$invalidate(0, account);
    	}

    	function field0_readonly_binding(value) {
    		readonly = value;
    		$$invalidate(1, readonly);
    	}

    	function field1_value_binding(value) {
    		account.login = value;
    		$$invalidate(0, account);
    	}

    	function field1_readonly_binding(value) {
    		readonly = value;
    		$$invalidate(1, readonly);
    	}

    	function field2_value_binding(value) {
    		account.password = value;
    		$$invalidate(0, account);
    	}

    	function field2_readonly_binding(value) {
    		readonly = value;
    		$$invalidate(1, readonly);
    	}

    	function field2_message_binding(value) {
    		passwordStrength = value;
    		($$invalidate(4, passwordStrength), $$invalidate(0, account));
    	}

    	function field3_value_binding(value) {
    		account.url = value;
    		$$invalidate(0, account);
    	}

    	function field3_readonly_binding(value) {
    		readonly = value;
    		$$invalidate(1, readonly);
    	}

    	function field4_value_binding(value) {
    		account.totp = value;
    		$$invalidate(0, account);
    	}

    	function field4_readonly_binding(value) {
    		readonly = value;
    		$$invalidate(1, readonly);
    	}

    	function field4_message_binding(value) {
    		totpMessage = value;
    		(($$invalidate(5, totpMessage), $$invalidate(17, totpCode)), $$invalidate(18, time));
    	}

    	function field_label_binding(value, field) {
    		field.name = value;
    		$$invalidate(0, account);
    	}

    	function field_value_binding(value, field) {
    		field.value = value;
    		$$invalidate(0, account);
    	}

    	function field_readonly_binding(value) {
    		readonly = value;
    		$$invalidate(1, readonly);
    	}

    	function field_type_binding(value, field) {
    		field.type = value;
    		$$invalidate(0, account);
    	}

    	function dialog0_visible_binding(value) {
    		qrCodeVisible = value;
    		$$invalidate(2, qrCodeVisible);
    	}

    	function textfield_value_binding(value) {
    		account.fields[editedFieldIndex].name = value;
    		$$invalidate(0, account);
    	}

    	function dialog1_visible_binding(value) {
    		visibleFieldNameModal = value;
    		($$invalidate(6, visibleFieldNameModal), $$invalidate(3, editedFieldIndex));
    	}

    	$$self.$set = $$props => {
    		if ("account" in $$props) $$invalidate(0, account = $$props.account);
    		if ("readonly" in $$props) $$invalidate(1, readonly = $$props.readonly);
    	};

    	$$self.$capture_state = () => ({
    		Textfield: Re,
    		Button: xe,
    		Icon: Le,
    		Menu: Mn,
    		Menuitem: Nn,
    		Dialog: hn,
    		Field,
    		ImagePicker,
    		createEventDispatcher,
    		dispatch,
    		account,
    		readonly,
    		totpCode,
    		qrCodeVisible,
    		time,
    		editedFieldIndex,
    		updateTotp,
    		edit,
    		save,
    		editAccount,
    		newAccount,
    		newField,
    		removeField,
    		editFieldName,
    		onKeyPressFieldLabel,
    		reset,
    		showQrCode,
    		passwordStrength,
    		totpMessage,
    		visibleFieldNameModal
    	});

    	$$self.$inject_state = $$props => {
    		if ("account" in $$props) $$invalidate(0, account = $$props.account);
    		if ("readonly" in $$props) $$invalidate(1, readonly = $$props.readonly);
    		if ("totpCode" in $$props) $$invalidate(17, totpCode = $$props.totpCode);
    		if ("qrCodeVisible" in $$props) $$invalidate(2, qrCodeVisible = $$props.qrCodeVisible);
    		if ("time" in $$props) $$invalidate(18, time = $$props.time);
    		if ("editedFieldIndex" in $$props) $$invalidate(3, editedFieldIndex = $$props.editedFieldIndex);
    		if ("passwordStrength" in $$props) $$invalidate(4, passwordStrength = $$props.passwordStrength);
    		if ("totpMessage" in $$props) $$invalidate(5, totpMessage = $$props.totpMessage);
    		if ("visibleFieldNameModal" in $$props) $$invalidate(6, visibleFieldNameModal = $$props.visibleFieldNameModal);
    	};

    	let passwordStrength;
    	let totpMessage;
    	let visibleFieldNameModal;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*account*/ 1) {
    			 $$invalidate(4, passwordStrength = account && account.password
    			? "Strength: " + account.password.length
    			: "");
    		}

    		if ($$self.$$.dirty[0] & /*totpCode, time*/ 393216) {
    			 $$invalidate(5, totpMessage = totpCode ? totpCode + " (" + time + ")" : "");
    		}

    		if ($$self.$$.dirty[0] & /*editedFieldIndex*/ 8) {
    			 $$invalidate(6, visibleFieldNameModal = editedFieldIndex >= 0);
    		}
    	};

    	return [
    		account,
    		readonly,
    		qrCodeVisible,
    		editedFieldIndex,
    		passwordStrength,
    		totpMessage,
    		visibleFieldNameModal,
    		edit,
    		save,
    		newField,
    		removeField,
    		editFieldName,
    		onKeyPressFieldLabel,
    		showQrCode,
    		editAccount,
    		newAccount,
    		reset,
    		totpCode,
    		time,
    		dispatch,
    		updateTotp,
    		imagepicker_src_binding,
    		imagepicker_readonly_binding,
    		field0_value_binding,
    		field0_readonly_binding,
    		field1_value_binding,
    		field1_readonly_binding,
    		field2_value_binding,
    		field2_readonly_binding,
    		field2_message_binding,
    		field3_value_binding,
    		field3_readonly_binding,
    		field4_value_binding,
    		field4_readonly_binding,
    		field4_message_binding,
    		field_label_binding,
    		field_value_binding,
    		field_readonly_binding,
    		field_type_binding,
    		dialog0_visible_binding,
    		textfield_value_binding,
    		dialog1_visible_binding
    	];
    }

    class AccountEditor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$4,
    			create_fragment$4,
    			safe_not_equal,
    			{
    				account: 0,
    				readonly: 1,
    				editAccount: 14,
    				newAccount: 15,
    				reset: 16
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AccountEditor",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get account() {
    		throw new Error("<AccountEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set account(value) {
    		throw new Error("<AccountEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get readonly() {
    		throw new Error("<AccountEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set readonly(value) {
    		throw new Error("<AccountEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get editAccount() {
    		return this.$$.ctx[14];
    	}

    	set editAccount(value) {
    		throw new Error("<AccountEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get newAccount() {
    		return this.$$.ctx[15];
    	}

    	set newAccount(value) {
    		throw new Error("<AccountEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reset() {
    		return this.$$.ctx[16];
    	}

    	set reset(value) {
    		throw new Error("<AccountEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ChangePassword.svelte generated by Svelte v3.22.2 */
    const file$5 = "src/ChangePassword.svelte";

    // (33:4) <div slot="title">
    function create_title_slot$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "New password!";
    			attr_dev(div, "slot", "title");
    			add_location(div, file$5, 32, 4, 775);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_title_slot$1.name,
    		type: "slot",
    		source: "(33:4) <div slot=\\\"title\\\">",
    		ctx
    	});

    	return block;
    }

    // (40:8) {#if canSubmit}
    function create_if_block_1$2(ctx) {
    	let current;

    	const button = new xe({
    			props: {
    				color: "primary",
    				raised: true,
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*changePassword*/ ctx[6]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(40:8) {#if canSubmit}",
    		ctx
    	});

    	return block;
    }

    // (43:12) <Icon style="margin-left: 5px">
    function create_default_slot_2$2(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M618.9,438.7c35.8,0,64.8,31.6,64.8,70.7v164.9c0,39-29,70.7-64.8,70.7H381.3c-35.8,0-64.8-31.6-64.8-70.7V509.4c0-39,29-70.7,64.8-70.7h57.5l0,0h122.5l0,0H618.9z M499.5,500.2c-33.8,0-61.3,26.2-61.3,58.6c0,21.6,16.8,38.2,35,48.3v76.1h52.5v-76.1c18.3-10.2,35-26.7,35-48.3C560.8,526.4,533.4,500.2,499.5,500.2z M500,316.3c-57.6,0-61.1,48.4-61.3,61.3v61.1h-61.6v-55.2c0,0,0-128.6,122.7-128.6c122.7,0,122.7,128.6,122.7,128.6v55.2h-61.2v-61.1C561.1,365,557.6,316.3,500,316.3z M500,990.1c-270.6,0-490-219.4-490-490c0-270.6,219.4-490,490-490c87.2,0,169,22.9,240,62.9l45.6-63.1l81.6,214.5L653.2,193l50.5-69.9C643.1,90.3,573.8,71.4,500,71.4c-236.8,0-428.8,192-428.8,428.8c0,236.8,192,428.7,428.8,428.7c236.8,0,428.8-192,428.8-428.7c0-57.8-11.6-112.9-32.3-163.2l56.6-23.3c23.7,57.5,37,120.4,37,186.5C990,770.7,770.6,990.1,500,990.1z");
    			add_location(path, file$5, 44, 20, 1368);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 1000 1000");
    			add_location(svg, file$5, 43, 16, 1283);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$2.name,
    		type: "slot",
    		source: "(43:12) <Icon style=\\\"margin-left: 5px\\\">",
    		ctx
    	});

    	return block;
    }

    // (41:8) <Button color="primary" raised on:click={changePassword}>
    function create_default_slot_1$2(ctx) {
    	let t;
    	let current;

    	const icon = new Le({
    			props: {
    				style: "margin-left: 5px",
    				$$slots: { default: [create_default_slot_2$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t = text("Change\n            ");
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(41:8) <Button color=\\\"primary\\\" raised on:click={changePassword}>",
    		ctx
    	});

    	return block;
    }

    // (39:4) <div slot="actions" class="actions center">
    function create_actions_slot(ctx) {
    	let div;
    	let current;
    	let if_block = /*canSubmit*/ ctx[5] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "slot", "actions");
    			attr_dev(div, "class", "actions center");
    			add_location(div, file$5, 38, 4, 1070);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*canSubmit*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*canSubmit*/ 32) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_actions_slot.name,
    		type: "slot",
    		source: "(39:4) <div slot=\\\"actions\\\" class=\\\"actions center\\\">",
    		ctx
    	});

    	return block;
    }

    // (51:4) {#if error}
    function create_if_block$3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Wrong password !";
    			attr_dev(div, "class", "error svelte-1hx3kg2");
    			add_location(div, file$5, 51, 8, 2307);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(51:4) {#if error}",
    		ctx
    	});

    	return block;
    }

    // (32:0) <Dialog width="290" bind:visible>
    function create_default_slot$2(ctx) {
    	let t0;
    	let updating_value;
    	let t1;
    	let updating_value_1;
    	let t2;
    	let updating_value_2;
    	let t3;
    	let t4;
    	let if_block_anchor;
    	let current;

    	function field0_value_binding(value) {
    		/*field0_value_binding*/ ctx[7].call(null, value);
    	}

    	let field0_props = {
    		label: "Old password",
    		type: "password",
    		copy: "0"
    	};

    	if (/*oldPassword*/ ctx[1] !== void 0) {
    		field0_props.value = /*oldPassword*/ ctx[1];
    	}

    	const field0 = new Field({ props: field0_props, $$inline: true });
    	binding_callbacks.push(() => bind(field0, "value", field0_value_binding));

    	function field1_value_binding(value) {
    		/*field1_value_binding*/ ctx[8].call(null, value);
    	}

    	let field1_props = {
    		label: "New password",
    		type: "password",
    		copy: "0"
    	};

    	if (/*newPassword*/ ctx[2] !== void 0) {
    		field1_props.value = /*newPassword*/ ctx[2];
    	}

    	const field1 = new Field({ props: field1_props, $$inline: true });
    	binding_callbacks.push(() => bind(field1, "value", field1_value_binding));

    	function field2_value_binding(value) {
    		/*field2_value_binding*/ ctx[9].call(null, value);
    	}

    	let field2_props = {
    		label: "Confirm",
    		type: "password",
    		copy: "0"
    	};

    	if (/*confirmPassword*/ ctx[3] !== void 0) {
    		field2_props.value = /*confirmPassword*/ ctx[3];
    	}

    	const field2 = new Field({ props: field2_props, $$inline: true });
    	binding_callbacks.push(() => bind(field2, "value", field2_value_binding));
    	let if_block = /*error*/ ctx[4] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			t0 = space();
    			create_component(field0.$$.fragment);
    			t1 = space();
    			create_component(field1.$$.fragment);
    			t2 = space();
    			create_component(field2.$$.fragment);
    			t3 = space();
    			t4 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			mount_component(field0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(field1, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(field2, target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, t4, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const field0_changes = {};

    			if (!updating_value && dirty & /*oldPassword*/ 2) {
    				updating_value = true;
    				field0_changes.value = /*oldPassword*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			field0.$set(field0_changes);
    			const field1_changes = {};

    			if (!updating_value_1 && dirty & /*newPassword*/ 4) {
    				updating_value_1 = true;
    				field1_changes.value = /*newPassword*/ ctx[2];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			field1.$set(field1_changes);
    			const field2_changes = {};

    			if (!updating_value_2 && dirty & /*confirmPassword*/ 8) {
    				updating_value_2 = true;
    				field2_changes.value = /*confirmPassword*/ ctx[3];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			field2.$set(field2_changes);

    			if (/*error*/ ctx[4]) {
    				if (if_block) ; else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(field0.$$.fragment, local);
    			transition_in(field1.$$.fragment, local);
    			transition_in(field2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(field0.$$.fragment, local);
    			transition_out(field1.$$.fragment, local);
    			transition_out(field2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			destroy_component(field0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(field1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(field2, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(t4);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(32:0) <Dialog width=\\\"290\\\" bind:visible>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let updating_visible;
    	let current;

    	function dialog_visible_binding(value) {
    		/*dialog_visible_binding*/ ctx[10].call(null, value);
    	}

    	let dialog_props = {
    		width: "290",
    		$$slots: {
    			default: [create_default_slot$2],
    			actions: [create_actions_slot],
    			title: [create_title_slot$1]
    		},
    		$$scope: { ctx }
    	};

    	if (/*visible*/ ctx[0] !== void 0) {
    		dialog_props.visible = /*visible*/ ctx[0];
    	}

    	const dialog = new hn({ props: dialog_props, $$inline: true });
    	binding_callbacks.push(() => bind(dialog, "visible", dialog_visible_binding));

    	const block = {
    		c: function create() {
    			create_component(dialog.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(dialog, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const dialog_changes = {};

    			if (dirty & /*$$scope, error, canSubmit, confirmPassword, newPassword, oldPassword*/ 2110) {
    				dialog_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_visible && dirty & /*visible*/ 1) {
    				updating_visible = true;
    				dialog_changes.visible = /*visible*/ ctx[0];
    				add_flush_callback(() => updating_visible = false);
    			}

    			dialog.$set(dialog_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dialog.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dialog.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dialog, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { visible = false } = $$props;
    	let oldPassword = "";
    	let newPassword = "";
    	let confirmPassword = "";
    	let error = false;

    	async function changePassword() {
    		let response = await fetch("/change_password", {
    			method: "post",
    			headers: { "Content-Type": "application/json;" },
    			body: JSON.stringify({
    				old_password: oldPassword,
    				new_password: newPassword
    			})
    		});

    		if (response.ok) {
    			$$invalidate(0, visible = false);
    		} else {
    			$$invalidate(4, error = true);
    		}
    	}

    	const writable_props = ["visible"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ChangePassword> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ChangePassword", $$slots, []);

    	function field0_value_binding(value) {
    		oldPassword = value;
    		$$invalidate(1, oldPassword);
    	}

    	function field1_value_binding(value) {
    		newPassword = value;
    		$$invalidate(2, newPassword);
    	}

    	function field2_value_binding(value) {
    		confirmPassword = value;
    		$$invalidate(3, confirmPassword);
    	}

    	function dialog_visible_binding(value) {
    		visible = value;
    		$$invalidate(0, visible);
    	}

    	$$self.$set = $$props => {
    		if ("visible" in $$props) $$invalidate(0, visible = $$props.visible);
    	};

    	$$self.$capture_state = () => ({
    		Textfield: Re,
    		Button: xe,
    		Icon: Le,
    		Dialog: hn,
    		Field,
    		visible,
    		oldPassword,
    		newPassword,
    		confirmPassword,
    		error,
    		changePassword,
    		canSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ("visible" in $$props) $$invalidate(0, visible = $$props.visible);
    		if ("oldPassword" in $$props) $$invalidate(1, oldPassword = $$props.oldPassword);
    		if ("newPassword" in $$props) $$invalidate(2, newPassword = $$props.newPassword);
    		if ("confirmPassword" in $$props) $$invalidate(3, confirmPassword = $$props.confirmPassword);
    		if ("error" in $$props) $$invalidate(4, error = $$props.error);
    		if ("canSubmit" in $$props) $$invalidate(5, canSubmit = $$props.canSubmit);
    	};

    	let canSubmit;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*newPassword, confirmPassword*/ 12) {
    			 $$invalidate(5, canSubmit = newPassword && newPassword === confirmPassword);
    		}
    	};

    	return [
    		visible,
    		oldPassword,
    		newPassword,
    		confirmPassword,
    		error,
    		canSubmit,
    		changePassword,
    		field0_value_binding,
    		field1_value_binding,
    		field2_value_binding,
    		dialog_visible_binding
    	];
    }

    class ChangePassword extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { visible: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ChangePassword",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get visible() {
    		throw new Error("<ChangePassword>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<ChangePassword>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Navbar.svelte generated by Svelte v3.22.2 */
    const file$6 = "src/Navbar.svelte";

    // (17:8) <Button on:click={() => dispatch('go_back')}>
    function create_default_slot_8$1(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				path: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8$1.name,
    		type: "slot",
    		source: "(17:8) <Button on:click={() => dispatch('go_back')}>",
    		ctx
    	});

    	return block;
    }

    // (21:8) <Button on:click={() => dispatch('new_folder')}>
    function create_default_slot_7$1(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				path: "m26,23l0,-3l1,0l0,3l3,0l0,1l-3,0l0,3l-1,0l0,-3l-3,0l0,-1l3,0l0,0zm-4.40029,3l-19.60674,0c-0.54686,0 -0.99297,-0.44405 -0.99297,-0.9918l0,-11.0082l27,0l0,4.20703c-0.47683,-0.13486 -0.97999,-0.20703 -1.5,-0.20703c-3.03757,0 -5.5,2.46243 -5.5,5.5c0,0.90022 0.21628,1.74993 0.59971,2.5l0,0l0,0zm0.65745,1l-20.26387,0c-1.09358,0 -1.99329,-0.89147 -1.99329,-1.99115l0,-18.0177c0,-1.10148 0.89667,-1.99115 2.00276,-1.99115l10.99724,0l2,4l11.99414,0c1.1088,0 2.00586,0.89323 2.00586,1.99509l0,7.60462c1.78084,0.91036 3,2.76295 3,4.90029c0,3.03757 -2.46243,5.5 -5.5,5.5c-1.70794,0 -3.23405,-0.7785 -4.24284,-2l0,0l0,0zm-21.25716,-14l0,-6.0082c0,-0.53649 0.44401,-0.9918 0.99173,-0.9918l10.40829,0l1.95997,4l12.63703,0c0.54915,0 1.00298,0.44811 1.00298,1.00087l0,1.99913l-27,0l0,0l0,0zm25.5,15c2.48528,0 4.5,-2.01472 4.5,-4.5c0,-2.48528 -2.01472,-4.5 -4.5,-4.5c-2.48528,0 -4.5,2.01472 -4.5,4.5c0,2.48528 2.01472,4.5 4.5,4.5l0,0z"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7$1.name,
    		type: "slot",
    		source: "(21:8) <Button on:click={() => dispatch('new_folder')}>",
    		ctx
    	});

    	return block;
    }

    // (25:8) <Button on:click={() => dispatch('lock')}>
    function create_default_slot_6$1(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				path: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6$1.name,
    		type: "slot",
    		source: "(25:8) <Button on:click={() => dispatch('lock')}>",
    		ctx
    	});

    	return block;
    }

    // (34:20) <Icon>
    function create_default_slot_5$2(ctx) {
    	let svg;
    	let circle0;
    	let circle1;
    	let circle2;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			circle0 = svg_element("circle");
    			circle1 = svg_element("circle");
    			circle2 = svg_element("circle");
    			attr_dev(circle0, "cx", "12");
    			attr_dev(circle0, "cy", "12");
    			attr_dev(circle0, "r", "1");
    			add_location(circle0, file$6, 34, 205, 2335);
    			attr_dev(circle1, "cx", "12");
    			attr_dev(circle1, "cy", "5");
    			attr_dev(circle1, "r", "1");
    			add_location(circle1, file$6, 34, 236, 2366);
    			attr_dev(circle2, "cx", "12");
    			attr_dev(circle2, "cy", "19");
    			attr_dev(circle2, "r", "1");
    			add_location(circle2, file$6, 34, 266, 2396);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$6, 34, 24, 2154);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, circle0);
    			append_dev(svg, circle1);
    			append_dev(svg, circle2);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5$2.name,
    		type: "slot",
    		source: "(34:20) <Icon>",
    		ctx
    	});

    	return block;
    }

    // (33:16) <Button>
    function create_default_slot_4$2(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				$$slots: { default: [create_default_slot_5$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$2.name,
    		type: "slot",
    		source: "(33:16) <Button>",
    		ctx
    	});

    	return block;
    }

    // (32:12) <div slot="activator">
    function create_activator_slot$1(ctx) {
    	let div;
    	let current;

    	const button = new xe({
    			props: {
    				$$slots: { default: [create_default_slot_4$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(button.$$.fragment);
    			attr_dev(div, "slot", "activator");
    			add_location(div, file$6, 31, 12, 2055);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(button, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_activator_slot$1.name,
    		type: "slot",
    		source: "(32:12) <div slot=\\\"activator\\\">",
    		ctx
    	});

    	return block;
    }

    // (42:20) <Icon style="margin-left: 5px">
    function create_default_slot_3$2(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M618.9,438.7c35.8,0,64.8,31.6,64.8,70.7v164.9c0,39-29,70.7-64.8,70.7H381.3c-35.8,0-64.8-31.6-64.8-70.7V509.4c0-39,29-70.7,64.8-70.7h57.5l0,0h122.5l0,0H618.9z M499.5,500.2c-33.8,0-61.3,26.2-61.3,58.6c0,21.6,16.8,38.2,35,48.3v76.1h52.5v-76.1c18.3-10.2,35-26.7,35-48.3C560.8,526.4,533.4,500.2,499.5,500.2z M500,316.3c-57.6,0-61.1,48.4-61.3,61.3v61.1h-61.6v-55.2c0,0,0-128.6,122.7-128.6c122.7,0,122.7,128.6,122.7,128.6v55.2h-61.2v-61.1C561.1,365,557.6,316.3,500,316.3z M500,990.1c-270.6,0-490-219.4-490-490c0-270.6,219.4-490,490-490c87.2,0,169,22.9,240,62.9l45.6-63.1l81.6,214.5L653.2,193l50.5-69.9C643.1,90.3,573.8,71.4,500,71.4c-236.8,0-428.8,192-428.8,428.8c0,236.8,192,428.7,428.8,428.7c236.8,0,428.8-192,428.8-428.7c0-57.8-11.6-112.9-32.3-163.2l56.6-23.3c23.7,57.5,37,120.4,37,186.5C990,770.7,770.6,990.1,500,990.1z");
    			add_location(path, file$6, 43, 28, 2799);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 1000 1000");
    			add_location(svg, file$6, 42, 24, 2706);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$2.name,
    		type: "slot",
    		source: "(42:20) <Icon style=\\\"margin-left: 5px\\\">",
    		ctx
    	});

    	return block;
    }

    // (40:16) <Button>
    function create_default_slot_2$3(ctx) {
    	let t;
    	let current;

    	const icon = new Le({
    			props: {
    				style: "margin-left: 5px",
    				$$slots: { default: [create_default_slot_3$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t = text("Change password\n                    ");
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$3.name,
    		type: "slot",
    		source: "(40:16) <Button>",
    		ctx
    	});

    	return block;
    }

    // (39:12) <Menuitem on:click={() => {modalVisible = true}}>
    function create_default_slot_1$3(ctx) {
    	let current;

    	const button = new xe({
    			props: {
    				$$slots: { default: [create_default_slot_2$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(39:12) <Menuitem on:click={() => {modalVisible = true}}>",
    		ctx
    	});

    	return block;
    }

    // (31:8) <Menu>
    function create_default_slot$3(ctx) {
    	let t;
    	let current;

    	const menuitem = new Nn({
    			props: {
    				$$slots: { default: [create_default_slot_1$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	menuitem.$on("click", /*click_handler_3*/ ctx[9]);

    	const block = {
    		c: function create() {
    			t = space();
    			create_component(menuitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			mount_component(menuitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const menuitem_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				menuitem_changes.$$scope = { dirty, ctx };
    			}

    			menuitem.$set(menuitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menuitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menuitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			destroy_component(menuitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(31:8) <Menu>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let updating_visible;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let updating_value;
    	let t4;
    	let current;

    	function changepassword_visible_binding(value) {
    		/*changepassword_visible_binding*/ ctx[3].call(null, value);
    	}

    	let changepassword_props = {};

    	if (/*modalVisible*/ ctx[1] !== void 0) {
    		changepassword_props.visible = /*modalVisible*/ ctx[1];
    	}

    	const changepassword = new ChangePassword({
    			props: changepassword_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(changepassword, "visible", changepassword_visible_binding));

    	const button0 = new xe({
    			props: {
    				$$slots: { default: [create_default_slot_8$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*click_handler*/ ctx[4]);

    	const button1 = new xe({
    			props: {
    				$$slots: { default: [create_default_slot_7$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*click_handler_1*/ ctx[5]);

    	const button2 = new xe({
    			props: {
    				$$slots: { default: [create_default_slot_6$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button2.$on("click", /*click_handler_2*/ ctx[6]);

    	function textfield_value_binding(value) {
    		/*textfield_value_binding*/ ctx[7].call(null, value);
    	}

    	let textfield_props = { placeholder: "Search" };

    	if (/*searchText*/ ctx[0] !== void 0) {
    		textfield_props.value = /*searchText*/ ctx[0];
    	}

    	const textfield = new Re({ props: textfield_props, $$inline: true });
    	binding_callbacks.push(() => bind(textfield, "value", textfield_value_binding));
    	textfield.$on("input", /*input_handler*/ ctx[8]);

    	const menu = new Mn({
    			props: {
    				$$slots: {
    					default: [create_default_slot$3],
    					activator: [create_activator_slot$1]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(changepassword.$$.fragment);
    			t0 = space();
    			create_component(button0.$$.fragment);
    			t1 = space();
    			create_component(button1.$$.fragment);
    			t2 = space();
    			create_component(button2.$$.fragment);
    			t3 = space();
    			create_component(textfield.$$.fragment);
    			t4 = space();
    			create_component(menu.$$.fragment);
    			attr_dev(div0, "class", "content svelte-nfqvn9");
    			add_location(div0, file$6, 13, 4, 328);
    			attr_dev(div1, "class", "navbar svelte-nfqvn9");
    			add_location(div1, file$6, 12, 0, 303);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(changepassword, div0, null);
    			append_dev(div0, t0);
    			mount_component(button0, div0, null);
    			append_dev(div0, t1);
    			mount_component(button1, div0, null);
    			append_dev(div0, t2);
    			mount_component(button2, div0, null);
    			append_dev(div0, t3);
    			mount_component(textfield, div0, null);
    			append_dev(div0, t4);
    			mount_component(menu, div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const changepassword_changes = {};

    			if (!updating_visible && dirty & /*modalVisible*/ 2) {
    				updating_visible = true;
    				changepassword_changes.visible = /*modalVisible*/ ctx[1];
    				add_flush_callback(() => updating_visible = false);
    			}

    			changepassword.$set(changepassword_changes);
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    			const textfield_changes = {};

    			if (!updating_value && dirty & /*searchText*/ 1) {
    				updating_value = true;
    				textfield_changes.value = /*searchText*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			textfield.$set(textfield_changes);
    			const menu_changes = {};

    			if (dirty & /*$$scope, modalVisible*/ 1026) {
    				menu_changes.$$scope = { dirty, ctx };
    			}

    			menu.$set(menu_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(changepassword.$$.fragment, local);
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			transition_in(textfield.$$.fragment, local);
    			transition_in(menu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(changepassword.$$.fragment, local);
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			transition_out(textfield.$$.fragment, local);
    			transition_out(menu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(changepassword);
    			destroy_component(button0);
    			destroy_component(button1);
    			destroy_component(button2);
    			destroy_component(textfield);
    			destroy_component(menu);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let searchText;
    	let modalVisible = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", $$slots, []);

    	function changepassword_visible_binding(value) {
    		modalVisible = value;
    		$$invalidate(1, modalVisible);
    	}

    	const click_handler = () => dispatch("go_back");
    	const click_handler_1 = () => dispatch("new_folder");
    	const click_handler_2 = () => dispatch("lock");

    	function textfield_value_binding(value) {
    		searchText = value;
    		$$invalidate(0, searchText);
    	}

    	const input_handler = () => {
    		dispatch("search", searchText);
    	};

    	const click_handler_3 = () => {
    		$$invalidate(1, modalVisible = true);
    	};

    	$$self.$capture_state = () => ({
    		Textfield: Re,
    		Button: xe,
    		Icon: Le,
    		Menu: Mn,
    		Menuitem: Nn,
    		ChangePassword,
    		createEventDispatcher,
    		dispatch,
    		searchText,
    		modalVisible
    	});

    	$$self.$inject_state = $$props => {
    		if ("searchText" in $$props) $$invalidate(0, searchText = $$props.searchText);
    		if ("modalVisible" in $$props) $$invalidate(1, modalVisible = $$props.modalVisible);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		searchText,
    		modalVisible,
    		dispatch,
    		changepassword_visible_binding,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		textfield_value_binding,
    		input_handler,
    		click_handler_3
    	];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/Menu.svelte generated by Svelte v3.22.2 */
    const file$7 = "src/Menu.svelte";

    function create_fragment$7(ctx) {
    	let div0;
    	let div0_style_value;
    	let t;
    	let div1;
    	let div1_style_value;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "menu svelte-1bvmuvu");
    			attr_dev(div0, "style", div0_style_value = "--visible: " + Number(/*visible*/ ctx[0]));
    			add_location(div0, file$7, 13, 0, 211);
    			attr_dev(div1, "class", "container svelte-1bvmuvu");
    			attr_dev(div1, "style", div1_style_value = "--visible: " + Number(/*visible*/ ctx[0]));
    			add_location(div1, file$7, 14, 0, 287);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(div0, "click", /*hide*/ ctx[1], false, false, false),
    				listen_dev(div1, "click", stop_propagation(/*click_handler*/ ctx[5]), false, false, true)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*visible*/ 1 && div0_style_value !== (div0_style_value = "--visible: " + Number(/*visible*/ ctx[0]))) {
    				attr_dev(div0, "style", div0_style_value);
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    				}
    			}

    			if (!current || dirty & /*visible*/ 1 && div1_style_value !== (div1_style_value = "--visible: " + Number(/*visible*/ ctx[0]))) {
    				attr_dev(div1, "style", div1_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { visible = true } = $$props;

    	function hide() {
    		$$invalidate(0, visible = false);
    		dispatch("hide");
    	}

    	const writable_props = ["visible"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Menu", $$slots, ['default']);

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("visible" in $$props) $$invalidate(0, visible = $$props.visible);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		visible,
    		hide
    	});

    	$$self.$inject_state = $$props => {
    		if ("visible" in $$props) $$invalidate(0, visible = $$props.visible);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [visible, hide, dispatch, $$scope, $$slots, click_handler];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { visible: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get visible() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Sortablegrid.svelte generated by Svelte v3.22.2 */
    const file$8 = "src/Sortablegrid.svelte";

    const get_item_slot_changes = dirty => ({
    	item: dirty & /*items*/ 1,
    	index: dirty & /*items*/ 1
    });

    const get_item_slot_context = ctx => ({
    	class: "item svelte-s0gawe",
    	item: /*item*/ ctx[20],
    	index: /*index*/ ctx[22]
    });

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[22] = i;
    	return child_ctx;
    }

    const get_actions_slot_changes = dirty => ({});
    const get_actions_slot_context = ctx => ({});

    // (212:8) {#each items as item, index (item)}
    function create_each_block$2(key_1, ctx) {
    	let div;
    	let t;
    	let div_folder_value;
    	let current;
    	let dispose;
    	const item_slot_template = /*$$slots*/ ctx[18].item;
    	const item_slot = create_slot(item_slot_template, ctx, /*$$scope*/ ctx[17], get_item_slot_context);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			if (item_slot) item_slot.c();
    			t = space();
    			attr_dev(div, "class", "container svelte-s0gawe");
    			attr_dev(div, "folder", div_folder_value = /*item*/ ctx[20].folder || 0);
    			add_location(div, file$8, 212, 8, 6775);
    			this.first = div;
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);

    			if (item_slot) {
    				item_slot.m(div, null);
    			}

    			append_dev(div, t);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(div, "mousedown", /*mouseDown*/ ctx[2], false, false, false),
    				listen_dev(div, "touchstart", /*mouseDown*/ ctx[2], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (item_slot) {
    				if (item_slot.p && dirty & /*$$scope, items*/ 131073) {
    					item_slot.p(get_slot_context(item_slot_template, ctx, /*$$scope*/ ctx[17], get_item_slot_context), get_slot_changes(item_slot_template, /*$$scope*/ ctx[17], dirty, get_item_slot_changes));
    				}
    			}

    			if (!current || dirty & /*items*/ 1 && div_folder_value !== (div_folder_value = /*item*/ ctx[20].folder || 0)) {
    				attr_dev(div, "folder", div_folder_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(item_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(item_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (item_slot) item_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(212:8) {#each items as item, index (item)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div2;
    	let div0;
    	let t;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	const actions_slot_template = /*$$slots*/ ctx[18].actions;
    	const actions_slot = create_slot(actions_slot_template, ctx, /*$$scope*/ ctx[17], get_actions_slot_context);
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*item*/ ctx[20];
    	validate_each_keys(ctx, each_value, get_each_context$2, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$2(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			if (actions_slot) actions_slot.c();
    			t = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "actions");
    			add_location(div0, file$8, 205, 4, 6528);
    			attr_dev(div1, "class", "items svelte-s0gawe");
    			add_location(div1, file$8, 210, 4, 6703);
    			attr_dev(div2, "class", "grid svelte-s0gawe");
    			add_location(div2, file$8, 204, 0, 6505);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);

    			if (actions_slot) {
    				actions_slot.m(div0, null);
    			}

    			/*div0_binding*/ ctx[19](div0);
    			append_dev(div2, t);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (actions_slot) {
    				if (actions_slot.p && dirty & /*$$scope*/ 131072) {
    					actions_slot.p(get_slot_context(actions_slot_template, ctx, /*$$scope*/ ctx[17], get_actions_slot_context), get_slot_changes(actions_slot_template, /*$$scope*/ ctx[17], dirty, get_actions_slot_changes));
    				}
    			}

    			if (dirty & /*items, mouseDown, $$scope*/ 131077) {
    				const each_value = /*items*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div1, outro_and_destroy_block, create_each_block$2, null, get_each_context$2);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(actions_slot, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(actions_slot, local);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (actions_slot) actions_slot.d(detaching);
    			/*div0_binding*/ ctx[19](null);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getElementIndex(element) {
    	// Return the index of the elemnt in its parent
    	return [].indexOf.call(element.parentNode.children, element);
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { items } = $$props;
    	let { dragging = false } = $$props;
    	const dispatch = createEventDispatcher();
    	let actionsSlot;

    	function resetGrid() {
    		// trigger change event if there's no change
    		// to reset the list
    		let i = items;

    		$$invalidate(0, items = []);

    		setTimeout(() => {
    			$$invalidate(0, items = i);
    		});
    	}

    	let draggedElement = null;
    	let draggedIndex = -1;
    	let destIndex = -1;
    	let action = null;
    	let intoFolder = false;
    	let ghostElement = null;

    	// Position of the mouse on the dragged element
    	let xPosElement = 0;

    	let yPosElement = 0;
    	let mouseTimer = null;

    	function mouseDown(event) {
    		if (event.button !== 0 && !event.touches) {
    			return;
    		}

    		let target = event.currentTarget;

    		mouseTimer = setTimeout(
    			() => {
    				$$invalidate(3, dragging = true);
    				draggedElement = target;
    				draggedIndex = getElementIndex(draggedElement);

    				if (event.touches) {
    					// mobile
    					xPosElement = draggedElement.offsetWidth / 2;

    					yPosElement = draggedElement.offsetHeight / 2;
    				} else {
    					// desktop
    					xPosElement = event.x - draggedElement.offsetLeft;

    					yPosElement = event.y - draggedElement.offsetTop;
    				}

    				// move the element in absolute position
    				let x = draggedElement.offsetLeft;

    				let y = draggedElement.offsetTop;
    				draggedElement.classList.add("dragged");
    				draggedElement.style.setProperty("--x", x + "px");
    				draggedElement.style.setProperty("--y", y + "px");

    				// create a ghost element to fill the space
    				ghostElement = document.createElement("div");

    				ghostElement.style.width = draggedElement.offsetWidth + "px";
    				ghostElement.style.height = draggedElement.offsetHeight + "px";
    				ghostElement.setAttribute("class", "ghost");
    				draggedElement.parentNode.insertBefore(ghostElement, draggedElement);
    				document.body.appendChild(draggedElement);
    			},
    			100
    		);
    	}

    	function mouseUp(event) {
    		if (mouseTimer) {
    			clearTimeout(mouseTimer);
    		}

    		if (!draggedElement || event.button !== 0 && !event.touches) {
    			return;
    		}

    		let draggedItem = items[draggedIndex];

    		if (action) {
    			dispatch("action", { action, item: draggedItem });
    		} else if (draggedIndex !== destIndex && destIndex >= 0 && draggedIndex >= 0) {
    			let destItem = items[destIndex];

    			if (!intoFolder) {
    				let item = items.splice(draggedIndex, 1)[0];
    				items.splice(destIndex, 0, item);
    			} else {
    				items.splice(draggedIndex, 1);
    			}

    			dispatch("move", {
    				from: draggedIndex,
    				to: destIndex,
    				fromItem: draggedItem,
    				intoFolder,
    				destItem
    			});
    		}

    		// clean the state
    		ghostElement.remove();

    		draggedElement.classList.remove("dragged");
    		draggedElement = null;
    		draggedIndex = -1;
    		destIndex = -1;
    		$$invalidate(3, dragging = false);
    		action = null;
    		intoFolder = false;
    		let previousFolder = document.querySelector(".move_into");

    		if (previousFolder) {
    			previousFolder.classList.remove("move_into");
    		}

    		resetGrid();
    	}

    	function mouseMove(event) {
    		if (!draggedElement) {
    			return;
    		}

    		// move the dragged element to the mouse position
    		if (event.touches) {
    			// mobile
    			var mouseX = event.touches[0].clientX;

    			var mouseY = event.touches[0].clientY;
    		} else {
    			// desktop
    			var mouseX = event.x;

    			var mouseY = event.y;
    		}

    		draggedElement.style.setProperty("--x", mouseX - xPosElement + "px");
    		draggedElement.style.setProperty("--y", mouseY - yPosElement + "px");

    		// move the ghost element if necessary
    		let hoverElements = document.elementsFromPoint(mouseX, mouseY);

    		// check if will perform an action
    		let actionElement = hoverElements.filter(el => el.parentNode && el.parentNode.getAttribute && el.parentNode.getAttribute("slot") === "actions");

    		if (actionElement.length) {
    			action = actionElement[0];
    			return;
    		}

    		// check if will move the item
    		let destItemsFiltered = hoverElements.filter(el => el.classList.contains("container"));

    		destItemsFiltered = destItemsFiltered.filter(el => el !== draggedElement);

    		if (destItemsFiltered.length) {
    			let destelement = destItemsFiltered[0];
    			destIndex = getElementIndex(destelement);
    			intoFolder = parseInt(destelement.getAttribute("folder"));

    			if (intoFolder) {
    				destelement.classList.add("move_into");
    			} else {
    				let previousFolder = document.querySelector(".move_into");

    				if (previousFolder) {
    					previousFolder.classList.remove("move_into");
    				}

    				let ghostIndex = getElementIndex(ghostElement);

    				if (ghostIndex < destIndex) {
    					destelement.parentNode.insertBefore(ghostElement, destelement.nextSibling);
    				} else {
    					destelement.parentNode.insertBefore(ghostElement, destelement);
    				}
    			}
    		} else {
    			intoFolder = false;
    			destIndex = getElementIndex(ghostElement);
    			let previousFolder = document.querySelector(".move_into");

    			if (previousFolder) {
    				previousFolder.classList.remove("move_into");
    			}
    		}
    	}

    	window.addEventListener("mouseup", mouseUp);
    	window.addEventListener("touchend", mouseUp);
    	window.addEventListener("mousemove", mouseMove);
    	window.addEventListener("touchmove", mouseMove);
    	const writable_props = ["items", "dragging"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sortablegrid> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sortablegrid", $$slots, ['actions','item']);

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, actionsSlot = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("dragging" in $$props) $$invalidate(3, dragging = $$props.dragging);
    		if ("$$scope" in $$props) $$invalidate(17, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onMount,
    		items,
    		dragging,
    		dispatch,
    		actionsSlot,
    		getElementIndex,
    		resetGrid,
    		draggedElement,
    		draggedIndex,
    		destIndex,
    		action,
    		intoFolder,
    		ghostElement,
    		xPosElement,
    		yPosElement,
    		mouseTimer,
    		mouseDown,
    		mouseUp,
    		mouseMove
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("dragging" in $$props) $$invalidate(3, dragging = $$props.dragging);
    		if ("actionsSlot" in $$props) $$invalidate(1, actionsSlot = $$props.actionsSlot);
    		if ("draggedElement" in $$props) draggedElement = $$props.draggedElement;
    		if ("draggedIndex" in $$props) draggedIndex = $$props.draggedIndex;
    		if ("destIndex" in $$props) destIndex = $$props.destIndex;
    		if ("action" in $$props) action = $$props.action;
    		if ("intoFolder" in $$props) intoFolder = $$props.intoFolder;
    		if ("ghostElement" in $$props) ghostElement = $$props.ghostElement;
    		if ("xPosElement" in $$props) xPosElement = $$props.xPosElement;
    		if ("yPosElement" in $$props) yPosElement = $$props.yPosElement;
    		if ("mouseTimer" in $$props) mouseTimer = $$props.mouseTimer;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		items,
    		actionsSlot,
    		mouseDown,
    		dragging,
    		draggedElement,
    		draggedIndex,
    		destIndex,
    		action,
    		intoFolder,
    		ghostElement,
    		xPosElement,
    		yPosElement,
    		mouseTimer,
    		dispatch,
    		resetGrid,
    		mouseUp,
    		mouseMove,
    		$$scope,
    		$$slots,
    		div0_binding
    	];
    }

    class Sortablegrid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { items: 0, dragging: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sortablegrid",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*items*/ ctx[0] === undefined && !("items" in props)) {
    			console.warn("<Sortablegrid> was created without expected prop 'items'");
    		}
    	}

    	get items() {
    		throw new Error("<Sortablegrid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Sortablegrid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dragging() {
    		throw new Error("<Sortablegrid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dragging(value) {
    		throw new Error("<Sortablegrid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Wallet.svelte generated by Svelte v3.22.2 */
    const file$9 = "src/Wallet.svelte";

    // (187:0) <Sidepanel bind:visible={menuVisible}>
    function create_default_slot_6$2(ctx) {
    	let current;
    	let accounteditor_props = {};

    	const accounteditor = new AccountEditor({
    			props: accounteditor_props,
    			$$inline: true
    		});

    	/*accounteditor_binding*/ ctx[21](accounteditor);
    	accounteditor.$on("save_account", /*saveAccount*/ ctx[7]);
    	accounteditor.$on("remove_account", /*removeAccount*/ ctx[8]);

    	const block = {
    		c: function create() {
    			create_component(accounteditor.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(accounteditor, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const accounteditor_changes = {};
    			accounteditor.$set(accounteditor_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(accounteditor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(accounteditor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*accounteditor_binding*/ ctx[21](null);
    			destroy_component(accounteditor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6$2.name,
    		type: "slot",
    		source: "(187:0) <Sidepanel bind:visible={menuVisible}>",
    		ctx
    	});

    	return block;
    }

    // (195:16) <Icon>
    function create_default_slot_5$3(ctx) {
    	let svg;
    	let polyline;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			polyline = svg_element("polyline");
    			attr_dev(polyline, "points", "3.41 16.34 12.1 7.66 20.59 16.14");
    			add_location(polyline, file$9, 195, 60, 6048);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$9, 195, 20, 6008);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, polyline);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5$3.name,
    		type: "slot",
    		source: "(195:16) <Icon>",
    		ctx
    	});

    	return block;
    }

    // (194:12) <Button class="parent_folder_action" raised icon>
    function create_default_slot_4$3(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				$$slots: { default: [create_default_slot_5$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};

    			if (dirty & /*$$scope*/ 1073741824) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$3.name,
    		type: "slot",
    		source: "(194:12) <Button class=\\\"parent_folder_action\\\" raised icon>",
    		ctx
    	});

    	return block;
    }

    // (200:16) <Icon>
    function create_default_slot_3$3(ctx) {
    	let svg;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z");
    			add_location(path0, file$9, 200, 60, 6298);
    			attr_dev(path1, "d", "M0 0h24v24H0z");
    			attr_dev(path1, "fill", "none");
    			add_location(path1, file$9, 200, 221, 6459);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$9, 200, 20, 6258);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$3.name,
    		type: "slot",
    		source: "(200:16) <Icon>",
    		ctx
    	});

    	return block;
    }

    // (199:12) <Button class="edit_account_action" raised icon>
    function create_default_slot_2$4(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				$$slots: { default: [create_default_slot_3$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};

    			if (dirty & /*$$scope*/ 1073741824) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$4.name,
    		type: "slot",
    		source: "(199:12) <Button class=\\\"edit_account_action\\\" raised icon>",
    		ctx
    	});

    	return block;
    }

    // (193:8) <div slot="actions" class="actions {dragging ? 'visible' : ''}">
    function create_actions_slot$1(ctx) {
    	let div;
    	let t;
    	let div_class_value;
    	let current;

    	const button0 = new xe({
    			props: {
    				class: "parent_folder_action",
    				raised: true,
    				icon: true,
    				$$slots: { default: [create_default_slot_4$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button1 = new xe({
    			props: {
    				class: "edit_account_action",
    				raised: true,
    				icon: true,
    				$$slots: { default: [create_default_slot_2$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(button0.$$.fragment);
    			t = space();
    			create_component(button1.$$.fragment);
    			attr_dev(div, "slot", "actions");
    			attr_dev(div, "class", div_class_value = "actions " + (/*dragging*/ ctx[2] ? "visible" : "") + " svelte-13ilwf4");
    			add_location(div, file$9, 192, 8, 5838);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(button0, div, null);
    			append_dev(div, t);
    			mount_component(button1, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 1073741824) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 1073741824) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);

    			if (!current || dirty & /*dragging*/ 4 && div_class_value !== (div_class_value = "actions " + (/*dragging*/ ctx[2] ? "visible" : "") + " svelte-13ilwf4")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(button0);
    			destroy_component(button1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_actions_slot$1.name,
    		type: "slot",
    		source: "(193:8) <div slot=\\\"actions\\\" class=\\\"actions {dragging ? 'visible' : ''}\\\">",
    		ctx
    	});

    	return block;
    }

    // (205:8) <div slot="item">
    function create_item_slot(ctx) {
    	let div;
    	let current;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[24](/*item*/ ctx[28], ...args);
    	}

    	function save_folder_handler(...args) {
    		return /*save_folder_handler*/ ctx[25](/*item*/ ctx[28], ...args);
    	}

    	const account = new Account({
    			props: { account: /*item*/ ctx[28] },
    			$$inline: true
    		});

    	account.$on("click", click_handler);
    	account.$on("save_folder", save_folder_handler);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(account.$$.fragment);
    			attr_dev(div, "slot", "item");
    			add_location(div, file$9, 204, 8, 6572);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(account, div, null);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const account_changes = {};
    			if (dirty & /*item*/ 268435456) account_changes.account = /*item*/ ctx[28];
    			account.$set(account_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(account.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(account.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(account);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_item_slot.name,
    		type: "slot",
    		source: "(205:8) <div slot=\\\"item\\\">",
    		ctx
    	});

    	return block;
    }

    // (192:4) <Sortablegrid on:move={moveAccount} on:action={accountAction} bind:items={wallet} let:item let:index bind:dragging={dragging}>
    function create_default_slot_1$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$4.name,
    		type: "slot",
    		source: "(192:4) <Sortablegrid on:move={moveAccount} on:action={accountAction} bind:items={wallet} let:item let:index bind:dragging={dragging}>",
    		ctx
    	});

    	return block;
    }

    // (209:4) <Button class="new_account {dragging ? '' : 'visible'}" raised icon on:click={newAccount}>
    function create_default_slot$4(ctx) {
    	let current;

    	const icon = new Le({
    			props: {
    				path: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(209:4) <Button class=\\\"new_account {dragging ? '' : 'visible'}\\\" raised icon on:click={newAccount}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let updating_visible;
    	let t0;
    	let t1;
    	let div;
    	let updating_items;
    	let updating_dragging;
    	let t2;
    	let current;

    	function sidepanel_visible_binding(value) {
    		/*sidepanel_visible_binding*/ ctx[22].call(null, value);
    	}

    	let sidepanel_props = {
    		$$slots: { default: [create_default_slot_6$2] },
    		$$scope: { ctx }
    	};

    	if (/*menuVisible*/ ctx[3] !== void 0) {
    		sidepanel_props.visible = /*menuVisible*/ ctx[3];
    	}

    	const sidepanel = new Vn({ props: sidepanel_props, $$inline: true });
    	binding_callbacks.push(() => bind(sidepanel, "visible", sidepanel_visible_binding));
    	const navbar = new Navbar({ $$inline: true });
    	navbar.$on("lock", /*lock_handler*/ ctx[23]);
    	navbar.$on("search", /*search*/ ctx[10]);
    	navbar.$on("new_folder", /*newFolder*/ ctx[11]);
    	navbar.$on("go_back", /*goBack*/ ctx[9]);

    	function sortablegrid_items_binding(value) {
    		/*sortablegrid_items_binding*/ ctx[26].call(null, value);
    	}

    	function sortablegrid_dragging_binding(value) {
    		/*sortablegrid_dragging_binding*/ ctx[27].call(null, value);
    	}

    	let sortablegrid_props = {
    		$$slots: {
    			default: [
    				create_default_slot_1$4,
    				({ item, index }) => ({ 28: item, 29: index }),
    				({ item, index }) => (item ? 268435456 : 0) | (index ? 536870912 : 0)
    			],
    			item: [
    				create_item_slot,
    				({ item, index }) => ({ 28: item, 29: index }),
    				({ item, index }) => (item ? 268435456 : 0) | (index ? 536870912 : 0)
    			],
    			actions: [
    				create_actions_slot$1,
    				({ item, index }) => ({ 28: item, 29: index }),
    				({ item, index }) => (item ? 268435456 : 0) | (index ? 536870912 : 0)
    			]
    		},
    		$$scope: { ctx }
    	};

    	if (/*wallet*/ ctx[0] !== void 0) {
    		sortablegrid_props.items = /*wallet*/ ctx[0];
    	}

    	if (/*dragging*/ ctx[2] !== void 0) {
    		sortablegrid_props.dragging = /*dragging*/ ctx[2];
    	}

    	const sortablegrid = new Sortablegrid({
    			props: sortablegrid_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(sortablegrid, "items", sortablegrid_items_binding));
    	binding_callbacks.push(() => bind(sortablegrid, "dragging", sortablegrid_dragging_binding));
    	sortablegrid.$on("move", /*moveAccount*/ ctx[4]);
    	sortablegrid.$on("action", /*accountAction*/ ctx[13]);

    	const button = new xe({
    			props: {
    				class: "new_account " + (/*dragging*/ ctx[2] ? "" : "visible"),
    				raised: true,
    				icon: true,
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*newAccount*/ ctx[6]);

    	const block = {
    		c: function create() {
    			create_component(sidepanel.$$.fragment);
    			t0 = space();
    			create_component(navbar.$$.fragment);
    			t1 = space();
    			div = element("div");
    			create_component(sortablegrid.$$.fragment);
    			t2 = space();
    			create_component(button.$$.fragment);
    			attr_dev(div, "class", "wallet svelte-13ilwf4");
    			add_location(div, file$9, 190, 0, 5678);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidepanel, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(navbar, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(sortablegrid, div, null);
    			append_dev(div, t2);
    			mount_component(button, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const sidepanel_changes = {};

    			if (dirty & /*$$scope, accountEditor*/ 1073741826) {
    				sidepanel_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_visible && dirty & /*menuVisible*/ 8) {
    				updating_visible = true;
    				sidepanel_changes.visible = /*menuVisible*/ ctx[3];
    				add_flush_callback(() => updating_visible = false);
    			}

    			sidepanel.$set(sidepanel_changes);
    			const sortablegrid_changes = {};

    			if (dirty & /*$$scope, item, dragging*/ 1342177284) {
    				sortablegrid_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_items && dirty & /*wallet*/ 1) {
    				updating_items = true;
    				sortablegrid_changes.items = /*wallet*/ ctx[0];
    				add_flush_callback(() => updating_items = false);
    			}

    			if (!updating_dragging && dirty & /*dragging*/ 4) {
    				updating_dragging = true;
    				sortablegrid_changes.dragging = /*dragging*/ ctx[2];
    				add_flush_callback(() => updating_dragging = false);
    			}

    			sortablegrid.$set(sortablegrid_changes);
    			const button_changes = {};
    			if (dirty & /*dragging*/ 4) button_changes.class = "new_account " + (/*dragging*/ ctx[2] ? "" : "visible");

    			if (dirty & /*$$scope*/ 1073741824) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidepanel.$$.fragment, local);
    			transition_in(navbar.$$.fragment, local);
    			transition_in(sortablegrid.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidepanel.$$.fragment, local);
    			transition_out(navbar.$$.fragment, local);
    			transition_out(sortablegrid.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidepanel, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(navbar, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			destroy_component(sortablegrid);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function computePasswordStrength(account) {
    	// Todo: better function
    	account.force = account.password.length * 10;

    	return account;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { wallet = [] } = $$props;
    	let currentFolderId = 0;
    	let activeAccountIndex = null;
    	let accountEditor;
    	let dragging;
    	let menuVisible = false;

    	function closeMenu() {
    		$$invalidate(3, menuVisible = false);
    		activeAccountIndex = null;
    		if (accountEditor) accountEditor.reset();
    	}

    	async function moveAccount(event) {
    		let response = await fetch("/move_account", {
    			method: "post",
    			headers: { "Content-Type": "application/json;" },
    			body: JSON.stringify({
    				account_id: event.detail.fromItem.id,
    				new_index: event.detail.to,
    				into_folder: event.detail.intoFolder,
    				dest_account_id: event.detail.destItem.id
    			})
    		});

    		if (!response.ok) {
    			dispatch("lock");
    		} else {
    			openFolder(currentFolderId);
    		}
    	}

    	function clickAccount(account) {
    		if (account.folder) {
    			openFolder(account.id);
    		} else {
    			editAccount(account);
    		}
    	}

    	function editAccount(account, read = true) {
    		activeAccountIndex = wallet.findIndex(a => a.id === account.id);
    		accountEditor.editAccount(wallet[activeAccountIndex], read);
    		$$invalidate(3, menuVisible = true);
    	}

    	function newAccount() {
    		activeAccountIndex = -1;

    		accountEditor.newAccount({
    			folder_id: currentFolderId,
    			icon: "img/account_default.svg"
    		});

    		$$invalidate(3, menuVisible = true);
    	}

    	async function saveAccount(event) {
    		let response = await fetch("/save_account", {
    			method: "post",
    			headers: { "Content-Type": "application/json;" },
    			body: JSON.stringify(event.detail.account)
    		});

    		if (response.ok) {
    			let account = computePasswordStrength(await response.json());

    			if (activeAccountIndex < 0) {
    				// new account
    				$$invalidate(0, wallet = wallet.concat(account));
    			} else {
    				// write on existing account
    				$$invalidate(0, wallet[activeAccountIndex] = account, wallet);
    			}
    		} else {
    			dispatch("lock");
    		}
    	}

    	async function removeAccount(event) {
    		let response = await fetch("/remove_account", {
    			method: "post",
    			headers: { "Content-Type": "application/json;" },
    			body: JSON.stringify(event.detail.account)
    		});

    		if (response.ok) {
    			$$invalidate(0, wallet = wallet.filter(account => {
    				return account.id !== event.detail.account.id;
    			}));

    			closeMenu();
    		} else {
    			dispatch("lock");
    		}
    	}

    	async function openFolder(folderId) {
    		let response = await fetch("/open_folder?id=" + encodeURIComponent(folderId || 0));

    		if (response.ok) {
    			currentFolderId = folderId;
    			document.cookie = "currentFolderId=" + folderId;
    			let accounts = await response.json();

    			for (let account of accounts) {
    				account = computePasswordStrength(account);
    			}

    			$$invalidate(0, wallet = accounts);
    		}
    	}

    	async function goBack() {
    		let response = await fetch("/account/" + encodeURIComponent(currentFolderId || 0));

    		if (response.ok) {
    			let folder = await response.json();
    			await openFolder(folder.folder_id);
    		}
    	}

    	async function search(event) {
    		if (!event.detail) {
    			openFolder(currentFolderId);
    			return;
    		}

    		let response = await fetch("/search?q=" + encodeURIComponent(event.detail));

    		if (response.ok) {
    			$$invalidate(0, wallet = await response.json());
    		}
    	}

    	async function newFolder() {
    		let folder = {
    			name: "Folder",
    			icon: "img/folder.svg",
    			folder: 1,
    			folder_id: currentFolderId
    		};

    		$$invalidate(0, wallet = wallet.concat(folder));
    		await saveFolder(folder);
    	}

    	async function saveFolder(folder) {
    		await saveAccount({ detail: { account: folder } });
    	}

    	async function accountAction(event) {
    		let action = event.detail.action.classList.contains("parent_folder_action")
    		? "parent"
    		: "edit";

    		let account = event.detail.item;

    		if (action === "parent") {
    			let response = await fetch("/move_up", {
    				method: "post",
    				headers: { "Content-Type": "application/json;" },
    				body: JSON.stringify({ account_id: account.id })
    			});

    			if (response.ok) {
    				await openFolder(currentFolderId);
    			}
    		} else if (action === "edit") {
    			editAccount(account, false);
    		}
    	}

    	const writable_props = ["wallet"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Wallet> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Wallet", $$slots, []);

    	function accounteditor_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, accountEditor = $$value);
    		});
    	}

    	function sidepanel_visible_binding(value) {
    		menuVisible = value;
    		$$invalidate(3, menuVisible);
    	}

    	function lock_handler(event) {
    		bubble($$self, event);
    	}

    	const click_handler = item => clickAccount(item);

    	const save_folder_handler = item => {
    		saveFolder(item);
    	};

    	function sortablegrid_items_binding(value) {
    		wallet = value;
    		$$invalidate(0, wallet);
    	}

    	function sortablegrid_dragging_binding(value) {
    		dragging = value;
    		$$invalidate(2, dragging);
    	}

    	$$self.$set = $$props => {
    		if ("wallet" in $$props) $$invalidate(0, wallet = $$props.wallet);
    	};

    	$$self.$capture_state = () => ({
    		Button: xe,
    		Icon: Le,
    		Sidepanel: Vn,
    		Account,
    		AccountEditor,
    		Navbar,
    		Menu,
    		Sortablegrid,
    		createEventDispatcher,
    		dispatch,
    		wallet,
    		currentFolderId,
    		activeAccountIndex,
    		accountEditor,
    		dragging,
    		menuVisible,
    		closeMenu,
    		computePasswordStrength,
    		moveAccount,
    		clickAccount,
    		editAccount,
    		newAccount,
    		saveAccount,
    		removeAccount,
    		openFolder,
    		goBack,
    		search,
    		newFolder,
    		saveFolder,
    		accountAction,
    		menuHideTrigger
    	});

    	$$self.$inject_state = $$props => {
    		if ("wallet" in $$props) $$invalidate(0, wallet = $$props.wallet);
    		if ("currentFolderId" in $$props) currentFolderId = $$props.currentFolderId;
    		if ("activeAccountIndex" in $$props) activeAccountIndex = $$props.activeAccountIndex;
    		if ("accountEditor" in $$props) $$invalidate(1, accountEditor = $$props.accountEditor);
    		if ("dragging" in $$props) $$invalidate(2, dragging = $$props.dragging);
    		if ("menuVisible" in $$props) $$invalidate(3, menuVisible = $$props.menuVisible);
    		if ("menuHideTrigger" in $$props) menuHideTrigger = $$props.menuHideTrigger;
    	};

    	let menuHideTrigger;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*menuVisible*/ 8) {
    			 menuHideTrigger = menuVisible ? "" : closeMenu();
    		}
    	};

    	return [
    		wallet,
    		accountEditor,
    		dragging,
    		menuVisible,
    		moveAccount,
    		clickAccount,
    		newAccount,
    		saveAccount,
    		removeAccount,
    		goBack,
    		search,
    		newFolder,
    		saveFolder,
    		accountAction,
    		openFolder,
    		currentFolderId,
    		activeAccountIndex,
    		menuHideTrigger,
    		dispatch,
    		closeMenu,
    		editAccount,
    		accounteditor_binding,
    		sidepanel_visible_binding,
    		lock_handler,
    		click_handler,
    		save_folder_handler,
    		sortablegrid_items_binding,
    		sortablegrid_dragging_binding
    	];
    }

    class Wallet extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { wallet: 0, openFolder: 14 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Wallet",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get wallet() {
    		throw new Error("<Wallet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set wallet(value) {
    		throw new Error("<Wallet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get openFolder() {
    		return this.$$.ctx[14];
    	}

    	set openFolder(value) {
    		throw new Error("<Wallet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/LockScreen.svelte generated by Svelte v3.22.2 */
    const file$a = "src/LockScreen.svelte";

    function create_fragment$a(ctx) {
    	let div;
    	let svg;
    	let path0;
    	let path1;
    	let t;
    	let updating_value;
    	let current;

    	function textfield_value_binding(value) {
    		/*textfield_value_binding*/ ctx[8].call(null, value);
    	}

    	let textfield_props = {
    		placeholder: "Password",
    		type: "password",
    		class: "lockscreen_password"
    	};

    	if (/*password*/ ctx[0] !== void 0) {
    		textfield_props.value = /*password*/ ctx[0];
    	}

    	const textfield = new Re({ props: textfield_props, $$inline: true });
    	binding_callbacks.push(() => bind(textfield, "value", textfield_value_binding));
    	textfield.$on("keypress", /*onKeyPress*/ ctx[3]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			t = space();
    			create_component(textfield.$$.fragment);
    			attr_dev(path0, "d", "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z");
    			attr_dev(path0, "class", "svelte-1ok83a9");
    			add_location(path0, file$a, 58, 8, 1698);
    			attr_dev(path1, "d", "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z");
    			attr_dev(path1, "class", "svelte-1ok83a9");
    			add_location(path1, file$a, 59, 8, 1942);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "class", "svelte-1ok83a9");
    			add_location(svg, file$a, 57, 4, 1606);
    			attr_dev(div, "class", "lock svelte-1ok83a9");
    			set_style(div, "--lock-value", /*svgValue*/ ctx[1]);
    			set_style(div, "--fill-color", /*fillColor*/ ctx[2]);
    			add_location(div, file$a, 56, 0, 1523);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(div, t);
    			mount_component(textfield, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const textfield_changes = {};

    			if (!updating_value && dirty & /*password*/ 1) {
    				updating_value = true;
    				textfield_changes.value = /*password*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			textfield.$set(textfield_changes);

    			if (!current || dirty & /*svgValue*/ 2) {
    				set_style(div, "--lock-value", /*svgValue*/ ctx[1]);
    			}

    			if (!current || dirty & /*fillColor*/ 4) {
    				set_style(div, "--fill-color", /*fillColor*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(textfield);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const maxLen = 8;

    function instance$a($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let password = "";
    	let wrongPassword = false;

    	async function checkPassword() {
    		let response = await fetch("/login", {
    			method: "post",
    			headers: { "Content-Type": "application/json;" },
    			body: JSON.stringify({ login: "admin", password })
    		});

    		if (response.ok) {
    			let response = await fetch("/open_folder");
    			let wallet = await response.json();
    			dispatch("open_wallet", wallet);
    		}

    		return response.ok;
    	}

    	async function unlock() {
    		if (!await checkPassword()) {
    			$$invalidate(0, password = "");
    			$$invalidate(4, wrongPassword = true);
    			let lockSvg = document.querySelector("svg");
    			lockSvg.classList.add("wrong_password");

    			setTimeout(
    				() => {
    					lockSvg.classList.remove("wrong_password");
    				},
    				1000
    			);
    		}
    	}

    	function onKeyPress(e) {
    		if (wrongPassword) {
    			$$invalidate(4, wrongPassword = false);
    		}

    		if (!e) e = window.event;

    		if ((e.keyCode || e.which) == 13) {
    			unlock();
    			return false;
    		}
    	}

    	checkPassword();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LockScreen> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("LockScreen", $$slots, []);

    	function textfield_value_binding(value) {
    		password = value;
    		$$invalidate(0, password);
    	}

    	$$self.$capture_state = () => ({
    		Textfield: Re,
    		Icon: Le,
    		createEventDispatcher,
    		dispatch,
    		maxLen,
    		password,
    		wrongPassword,
    		checkPassword,
    		unlock,
    		onKeyPress,
    		svgValue,
    		fillColor
    	});

    	$$self.$inject_state = $$props => {
    		if ("password" in $$props) $$invalidate(0, password = $$props.password);
    		if ("wrongPassword" in $$props) $$invalidate(4, wrongPassword = $$props.wrongPassword);
    		if ("svgValue" in $$props) $$invalidate(1, svgValue = $$props.svgValue);
    		if ("fillColor" in $$props) $$invalidate(2, fillColor = $$props.fillColor);
    	};

    	let svgValue;
    	let fillColor;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*wrongPassword, password*/ 17) {
    			 $$invalidate(1, svgValue = wrongPassword
    			? 0
    			: (100 - 33) * (maxLen - Math.min(password.length, maxLen)) / maxLen + 33);
    		}

    		if ($$self.$$.dirty & /*wrongPassword*/ 16) {
    			 $$invalidate(2, fillColor = wrongPassword ? "var(--error-color)" : "var(--accent)");
    		}
    	};

    	return [
    		password,
    		svgValue,
    		fillColor,
    		onKeyPress,
    		wrongPassword,
    		dispatch,
    		checkPassword,
    		unlock,
    		textfield_value_binding
    	];
    }

    class LockScreen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LockScreen",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    function flip(node, animation, params) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        const scaleX = animation.from.width / node.clientWidth;
        const scaleY = animation.from.height / node.clientHeight;
        const dx = (animation.from.left - animation.to.left) / scaleX;
        const dy = (animation.from.top - animation.to.top) / scaleY;
        const d = Math.sqrt(dx * dx + dy * dy);
        const { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;
        return {
            delay,
            duration: is_function(duration) ? duration(d) : duration,
            easing,
            css: (_t, u) => `transform: ${transform} translate(${u * dx}px, ${u * dy}px);`
        };
    }

    /* src/App.svelte generated by Svelte v3.22.2 */

    const { document: document_1 } = globals;
    const file$b = "src/App.svelte";

    // (38:4) {:else}
    function create_else_block$3(ctx) {
    	let current;
    	let wallet_1_props = { wallet: /*wallet*/ ctx[0] };
    	const wallet_1 = new Wallet({ props: wallet_1_props, $$inline: true });
    	/*wallet_1_binding*/ ctx[5](wallet_1);
    	wallet_1.$on("lock", /*lock*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(wallet_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(wallet_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const wallet_1_changes = {};
    			if (dirty & /*wallet*/ 1) wallet_1_changes.wallet = /*wallet*/ ctx[0];
    			wallet_1.$set(wallet_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wallet_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wallet_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*wallet_1_binding*/ ctx[5](null);
    			destroy_component(wallet_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(38:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (36:4) {#if locked}
    function create_if_block$4(ctx) {
    	let current;
    	const lockscreen = new LockScreen({ $$inline: true });
    	lockscreen.$on("open_wallet", /*openWallet*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(lockscreen.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(lockscreen, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lockscreen.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lockscreen.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(lockscreen, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(36:4) {#if locked}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let script;
    	let script_src_value;
    	let t;
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*locked*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			script = element("script");
    			t = space();
    			div = element("div");
    			if_block.c();
    			if (script.src !== (script_src_value = "/lib/qrious.min.js")) attr_dev(script, "src", script_src_value);
    			add_location(script, file$b, 31, 4, 777);
    			attr_dev(div, "class", "root svelte-1801uxd");
    			add_location(div, file$b, 34, 0, 836);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document_1.head, script);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(script);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getCookie(name) {
    	const value = `; ${document.cookie}`;
    	const parts = value.split(`; ${name}=`);
    	if (parts.length === 2) return parts.pop().split(";").shift();
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let wallet = [];
    	let locked = true;
    	let walletElement;

    	function openWallet(event) {
    		$$invalidate(1, locked = false);

    		setTimeout(() => {
    			// do after the DOM is updated
    			walletElement.openFolder(getCookie("currentFolderId") || 0);
    		});
    	}

    	async function lock() {
    		await fetch("/logout");
    		$$invalidate(1, locked = true);
    		$$invalidate(0, wallet = []);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function wallet_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, walletElement = $$value);
    		});
    	}

    	$$self.$capture_state = () => ({
    		Wallet,
    		LockScreen,
    		flip,
    		wallet,
    		locked,
    		walletElement,
    		openWallet,
    		getCookie,
    		lock
    	});

    	$$self.$inject_state = $$props => {
    		if ("wallet" in $$props) $$invalidate(0, wallet = $$props.wallet);
    		if ("locked" in $$props) $$invalidate(1, locked = $$props.locked);
    		if ("walletElement" in $$props) $$invalidate(2, walletElement = $$props.walletElement);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [wallet, locked, walletElement, openWallet, lock, wallet_1_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
