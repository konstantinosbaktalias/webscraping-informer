
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
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
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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
    function add_render_callback(fn) {
        render_callbacks.push(fn);
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
            set_current_component(null);
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
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\App.svelte generated by Svelte v3.31.0 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (83:18) 
    function create_if_block_1(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Invalid data given";
    			attr_dev(div0, "class", "alert alert-danger");
    			attr_dev(div0, "role", "alert");
    			add_location(div0, file, 84, 4, 2046);
    			attr_dev(div1, "class", "p-5");
    			add_location(div1, file, 83, 3, 2024);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(83:18) ",
    		ctx
    	});

    	return block;
    }

    // (79:2) {#if success}
    function create_if_block(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Thanks for your submission, you will be informed in your email you given";
    			attr_dev(div0, "class", "alert alert-success");
    			attr_dev(div0, "role", "alert");
    			add_location(div0, file, 80, 4, 1864);
    			attr_dev(div1, "class", "p-5");
    			add_location(div1, file, 79, 5, 1842);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(79:2) {#if success}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div11;
    	let t2;
    	let form;
    	let div0;
    	let label0;
    	let t4;
    	let input0;
    	let t5;
    	let div1;
    	let label1;
    	let t7;
    	let input1;
    	let t8;
    	let div2;
    	let label2;
    	let t10;
    	let input2;
    	let t11;
    	let div3;
    	let label3;
    	let t13;
    	let input3;
    	let t14;
    	let div4;
    	let label4;
    	let t16;
    	let input4;
    	let t17;
    	let div5;
    	let label5;
    	let t19;
    	let input5;
    	let t20;
    	let div6;
    	let label6;
    	let t22;
    	let input6;
    	let input6_disabled_value;
    	let t23;
    	let div7;
    	let label7;
    	let t25;
    	let input7;
    	let input7_disabled_value;
    	let t26;
    	let div8;
    	let label8;
    	let t28;
    	let input8;
    	let t29;
    	let div9;
    	let label9;
    	let t31;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let option5;
    	let option6;
    	let option7;
    	let option8;
    	let t41;
    	let div10;
    	let label10;
    	let t43;
    	let select1;
    	let option9;
    	let option10;
    	let option11;
    	let option12;
    	let option13;
    	let option14;
    	let option15;
    	let option16;
    	let t52;
    	let button;
    	let t54;
    	let div14;
    	let h3;
    	let t56;
    	let div13;
    	let ol;
    	let li0;
    	let t58;
    	let li1;
    	let t60;
    	let li2;
    	let t62;
    	let li3;
    	let t64;
    	let li4;
    	let t66;
    	let li5;
    	let t68;
    	let li6;
    	let t69;
    	let li7;
    	let t71;
    	let li8;
    	let t73;
    	let div12;
    	let h5;
    	let t75;
    	let p;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*success*/ ctx[4]) return create_if_block;
    		if (/*error*/ ctx[5]) return create_if_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Web analyzer";
    			t1 = space();
    			div11 = element("div");
    			if (if_block) if_block.c();
    			t2 = space();
    			form = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Email:";
    			t4 = space();
    			input0 = element("input");
    			t5 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Title:";
    			t7 = space();
    			input1 = element("input");
    			t8 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "URL:";
    			t10 = space();
    			input2 = element("input");
    			t11 = space();
    			div3 = element("div");
    			label3 = element("label");
    			label3.textContent = "Id or class(Check if id)";
    			t13 = space();
    			input3 = element("input");
    			t14 = space();
    			div4 = element("div");
    			label4 = element("label");
    			label4.textContent = "Data id or class:";
    			t16 = space();
    			input4 = element("input");
    			t17 = space();
    			div5 = element("div");
    			label5 = element("label");
    			label5.textContent = "Symbols";
    			t19 = space();
    			input5 = element("input");
    			t20 = space();
    			div6 = element("div");
    			label6 = element("label");
    			label6.textContent = "Index Start:";
    			t22 = space();
    			input6 = element("input");
    			t23 = space();
    			div7 = element("div");
    			label7 = element("label");
    			label7.textContent = "Index End:";
    			t25 = space();
    			input7 = element("input");
    			t26 = space();
    			div8 = element("div");
    			label8 = element("label");
    			label8.textContent = "Integer or Floar(Check if integer)";
    			t28 = space();
    			input8 = element("input");
    			t29 = space();
    			div9 = element("div");
    			label9 = element("label");
    			label9.textContent = "Inform me every...";
    			t31 = space();
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "10 minutes";
    			option1 = element("option");
    			option1.textContent = "30 minutes";
    			option2 = element("option");
    			option2.textContent = "1 hour";
    			option3 = element("option");
    			option3.textContent = "2 hours";
    			option4 = element("option");
    			option4.textContent = "5 hours";
    			option5 = element("option");
    			option5.textContent = "1 day";
    			option6 = element("option");
    			option6.textContent = "3 days";
    			option7 = element("option");
    			option7.textContent = "7 days";
    			option8 = element("option");
    			option8.textContent = "14 days";
    			t41 = space();
    			div10 = element("div");
    			label10 = element("label");
    			label10.textContent = "Inform me for...";
    			t43 = space();
    			select1 = element("select");
    			option9 = element("option");
    			option9.textContent = "1 day";
    			option10 = element("option");
    			option10.textContent = "3 days";
    			option11 = element("option");
    			option11.textContent = "1 week";
    			option12 = element("option");
    			option12.textContent = "2 weeks";
    			option13 = element("option");
    			option13.textContent = "1 month";
    			option14 = element("option");
    			option14.textContent = "3 months";
    			option15 = element("option");
    			option15.textContent = "6 months";
    			option16 = element("option");
    			option16.textContent = "1 year";
    			t52 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			t54 = space();
    			div14 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Instructions";
    			t56 = space();
    			div13 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			li0.textContent = "Input your email";
    			t58 = space();
    			li1 = element("li");
    			li1.textContent = "Input a title of your choice";
    			t60 = space();
    			li2 = element("li");
    			li2.textContent = "Input the url of the target's page";
    			t62 = space();
    			li3 = element("li");
    			li3.textContent = "Check the checkbox to select the target by id else it will be selcted by its class name";
    			t64 = space();
    			li4 = element("li");
    			li4.textContent = "Input the id or class name";
    			t66 = space();
    			li5 = element("li");
    			li5.textContent = "Check the checkbox if the target contains characters other than number (for example '$', '€'..) and input the \n\t\t\t\t\tindex that the target starts and the index that it ends. Note this is 0-indexed";
    			t68 = space();
    			li6 = element("li");
    			t69 = space();
    			li7 = element("li");
    			li7.textContent = "Select how often you want to be informed";
    			t71 = space();
    			li8 = element("li");
    			li8.textContent = "Select how long you want to be informed";
    			t73 = space();
    			div12 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Note*";
    			t75 = space();
    			p = element("p");
    			p.textContent = "Some websites may not support webscraping";
    			attr_dev(h1, "class", "text-center");
    			add_location(h1, file, 76, 1, 1735);
    			attr_dev(label0, "for", "email");
    			attr_dev(label0, "class", "form-label");
    			add_location(label0, file, 89, 4, 2233);
    			attr_dev(input0, "type", "email");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "email");
    			add_location(input0, file, 90, 4, 2290);
    			attr_dev(div0, "class", "w-75 mb-3");
    			add_location(div0, file, 88, 3, 2205);
    			attr_dev(label1, "for", "title");
    			attr_dev(label1, "class", "form-label");
    			add_location(label1, file, 93, 4, 2424);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "title");
    			add_location(input1, file, 94, 4, 2481);
    			attr_dev(div1, "class", "w-75 mb-3");
    			add_location(div1, file, 92, 3, 2396);
    			attr_dev(label2, "for", "url");
    			attr_dev(label2, "class", "form-label");
    			add_location(label2, file, 97, 4, 2614);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "id", "url");
    			add_location(input2, file, 98, 4, 2667);
    			attr_dev(div2, "class", "w-75 mb-3");
    			add_location(div2, file, 96, 3, 2586);
    			attr_dev(label3, "for", "id");
    			attr_dev(label3, "class", "form-check-label");
    			add_location(label3, file, 101, 4, 2797);
    			attr_dev(input3, "type", "checkbox");
    			attr_dev(input3, "class", "form-check-input");
    			attr_dev(input3, "id", "id");
    			add_location(input3, file, 102, 4, 2875);
    			attr_dev(div3, "class", "form-check");
    			add_location(div3, file, 100, 3, 2768);
    			attr_dev(label4, "for", "data_id");
    			attr_dev(label4, "class", "form-label");
    			add_location(label4, file, 105, 4, 3001);
    			attr_dev(input4, "type", "text");
    			attr_dev(input4, "class", "form-control");
    			attr_dev(input4, "id", "data_id");
    			add_location(input4, file, 106, 4, 3071);
    			attr_dev(div4, "class", "w-75 mb-3");
    			add_location(div4, file, 104, 3, 2973);
    			attr_dev(label5, "for", "symbols");
    			attr_dev(label5, "class", "form-check-label");
    			add_location(label5, file, 109, 4, 3209);
    			attr_dev(input5, "type", "checkbox");
    			attr_dev(input5, "class", "form-check-input");
    			attr_dev(input5, "id", "symbols");
    			add_location(input5, file, 110, 4, 3275);
    			attr_dev(div5, "class", "form-check");
    			add_location(div5, file, 108, 3, 3180);
    			attr_dev(label6, "for", "instart");
    			attr_dev(label6, "class", "form-label");
    			add_location(label6, file, 113, 4, 3402);
    			attr_dev(input6, "type", "number");
    			attr_dev(input6, "class", "form-control w-25 d-inline");
    			attr_dev(input6, "id", "instart");
    			input6.disabled = input6_disabled_value = !/*symbols*/ ctx[10];
    			add_location(input6, file, 114, 4, 3467);
    			attr_dev(div6, "class", "w-75 mb-3");
    			add_location(div6, file, 112, 3, 3374);
    			attr_dev(label7, "for", "inend");
    			attr_dev(label7, "class", "form-label");
    			add_location(label7, file, 117, 4, 3644);
    			attr_dev(input7, "type", "number");
    			attr_dev(input7, "class", "form-control w-25 d-inline");
    			attr_dev(input7, "id", "inend");
    			input7.disabled = input7_disabled_value = !/*symbols*/ ctx[10];
    			add_location(input7, file, 118, 4, 3705);
    			attr_dev(div7, "class", "w-75 mb-3");
    			add_location(div7, file, 116, 3, 3616);
    			attr_dev(label8, "for", "intfloat");
    			attr_dev(label8, "class", "form-check-label");
    			add_location(label8, file, 121, 4, 3879);
    			attr_dev(input8, "type", "checkbox");
    			attr_dev(input8, "class", "form-check-input");
    			attr_dev(input8, "id", "intfloat");
    			add_location(input8, file, 122, 4, 3973);
    			attr_dev(div8, "class", "form-check");
    			add_location(div8, file, 120, 3, 3850);
    			attr_dev(label9, "for", "notifications");
    			attr_dev(label9, "class", "form-label");
    			add_location(label9, file, 125, 4, 4106);
    			option0.__value = "10";
    			option0.value = option0.__value;
    			add_location(option0, file, 127, 5, 4283);
    			option1.__value = "30";
    			option1.value = option1.__value;
    			add_location(option1, file, 128, 5, 4327);
    			option2.__value = "60";
    			option2.value = option2.__value;
    			add_location(option2, file, 129, 5, 4371);
    			option3.__value = "120";
    			option3.value = option3.__value;
    			add_location(option3, file, 130, 5, 4411);
    			option4.__value = "300";
    			option4.value = option4.__value;
    			add_location(option4, file, 131, 5, 4453);
    			option5.__value = "1440";
    			option5.value = option5.__value;
    			add_location(option5, file, 132, 5, 4495);
    			option6.__value = "4320";
    			option6.value = option6.__value;
    			add_location(option6, file, 133, 5, 4536);
    			option7.__value = "10080";
    			option7.value = option7.__value;
    			add_location(option7, file, 134, 5, 4578);
    			option8.__value = "20160";
    			option8.value = option8.__value;
    			add_location(option8, file, 135, 5, 4621);
    			attr_dev(select0, "id", "notifications");
    			attr_dev(select0, "class", "form-select");
    			add_location(select0, file, 126, 4, 4183);
    			attr_dev(div9, "class", "w-75 mb-3");
    			add_location(div9, file, 124, 3, 4078);
    			attr_dev(label10, "for", "period");
    			attr_dev(label10, "class", "form-label");
    			add_location(label10, file, 139, 4, 4715);
    			option9.__value = "1";
    			option9.value = option9.__value;
    			add_location(option9, file, 141, 5, 4869);
    			option10.__value = "3";
    			option10.value = option10.__value;
    			add_location(option10, file, 142, 5, 4907);
    			option11.__value = "7";
    			option11.value = option11.__value;
    			add_location(option11, file, 143, 5, 4946);
    			option12.__value = "14";
    			option12.value = option12.__value;
    			add_location(option12, file, 144, 5, 4985);
    			option13.__value = "30";
    			option13.value = option13.__value;
    			add_location(option13, file, 145, 5, 5026);
    			option14.__value = "90";
    			option14.value = option14.__value;
    			add_location(option14, file, 146, 5, 5067);
    			option15.__value = "180";
    			option15.value = option15.__value;
    			add_location(option15, file, 147, 5, 5109);
    			option16.__value = "365";
    			option16.value = option16.__value;
    			add_location(option16, file, 148, 5, 5152);
    			attr_dev(select1, "id", "period");
    			attr_dev(select1, "class", "form-select");
    			add_location(select1, file, 140, 4, 4783);
    			attr_dev(div10, "class", "w-75 mb-3");
    			add_location(div10, file, 138, 3, 4687);
    			attr_dev(button, "class", "btn btn-primary mt-3");
    			add_location(button, file, 151, 3, 5215);
    			attr_dev(form, "class", "container p-5");
    			add_location(form, file, 87, 2, 2137);
    			attr_dev(div11, "class", "container shadow p-7 rounded");
    			add_location(div11, file, 77, 1, 1778);
    			attr_dev(h3, "class", "text-center pt-5");
    			add_location(h3, file, 155, 2, 5353);
    			add_location(li0, file, 158, 4, 5450);
    			add_location(li1, file, 159, 4, 5480);
    			add_location(li2, file, 160, 4, 5522);
    			add_location(li3, file, 161, 4, 5570);
    			add_location(li4, file, 162, 4, 5671);
    			add_location(li5, file, 163, 4, 5711);
    			add_location(li6, file, 165, 4, 5920);
    			add_location(li7, file, 166, 4, 5934);
    			add_location(li8, file, 167, 4, 5988);
    			attr_dev(ol, "class", "p-5");
    			add_location(ol, file, 157, 3, 5429);
    			add_location(h5, file, 170, 4, 6071);
    			add_location(p, file, 171, 4, 6090);
    			attr_dev(div12, "class", "p-3");
    			add_location(div12, file, 169, 3, 6049);
    			attr_dev(div13, "class", "container");
    			add_location(div13, file, 156, 2, 5402);
    			attr_dev(div14, "class", "container shadow p-7 rounded");
    			add_location(div14, file, 154, 1, 5308);
    			attr_dev(main, "class", "container p-5");
    			add_location(main, file, 75, 0, 1705);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div11);
    			if (if_block) if_block.m(div11, null);
    			append_dev(div11, t2);
    			append_dev(div11, form);
    			append_dev(form, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t4);
    			append_dev(div0, input0);
    			append_dev(form, t5);
    			append_dev(form, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t7);
    			append_dev(div1, input1);
    			append_dev(form, t8);
    			append_dev(form, div2);
    			append_dev(div2, label2);
    			append_dev(div2, t10);
    			append_dev(div2, input2);
    			append_dev(form, t11);
    			append_dev(form, div3);
    			append_dev(div3, label3);
    			append_dev(div3, t13);
    			append_dev(div3, input3);
    			input3.checked = /*id_or_class*/ ctx[9];
    			append_dev(form, t14);
    			append_dev(form, div4);
    			append_dev(div4, label4);
    			append_dev(div4, t16);
    			append_dev(div4, input4);
    			append_dev(form, t17);
    			append_dev(form, div5);
    			append_dev(div5, label5);
    			append_dev(div5, t19);
    			append_dev(div5, input5);
    			input5.checked = /*symbols*/ ctx[10];
    			append_dev(form, t20);
    			append_dev(form, div6);
    			append_dev(div6, label6);
    			append_dev(div6, t22);
    			append_dev(div6, input6);
    			append_dev(form, t23);
    			append_dev(form, div7);
    			append_dev(div7, label7);
    			append_dev(div7, t25);
    			append_dev(div7, input7);
    			append_dev(form, t26);
    			append_dev(form, div8);
    			append_dev(div8, label8);
    			append_dev(div8, t28);
    			append_dev(div8, input8);
    			input8.checked = /*int_or_float*/ ctx[8];
    			append_dev(form, t29);
    			append_dev(form, div9);
    			append_dev(div9, label9);
    			append_dev(div9, t31);
    			append_dev(div9, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			append_dev(select0, option3);
    			append_dev(select0, option4);
    			append_dev(select0, option5);
    			append_dev(select0, option6);
    			append_dev(select0, option7);
    			append_dev(select0, option8);
    			append_dev(form, t41);
    			append_dev(form, div10);
    			append_dev(div10, label10);
    			append_dev(div10, t43);
    			append_dev(div10, select1);
    			append_dev(select1, option9);
    			append_dev(select1, option10);
    			append_dev(select1, option11);
    			append_dev(select1, option12);
    			append_dev(select1, option13);
    			append_dev(select1, option14);
    			append_dev(select1, option15);
    			append_dev(select1, option16);
    			append_dev(form, t52);
    			append_dev(form, button);
    			append_dev(main, t54);
    			append_dev(main, div14);
    			append_dev(div14, h3);
    			append_dev(div14, t56);
    			append_dev(div14, div13);
    			append_dev(div13, ol);
    			append_dev(ol, li0);
    			append_dev(ol, t58);
    			append_dev(ol, li1);
    			append_dev(ol, t60);
    			append_dev(ol, li2);
    			append_dev(ol, t62);
    			append_dev(ol, li3);
    			append_dev(ol, t64);
    			append_dev(ol, li4);
    			append_dev(ol, t66);
    			append_dev(ol, li5);
    			append_dev(ol, t68);
    			append_dev(ol, li6);
    			append_dev(ol, t69);
    			append_dev(ol, li7);
    			append_dev(ol, t71);
    			append_dev(ol, li8);
    			append_dev(div13, t73);
    			append_dev(div13, div12);
    			append_dev(div12, h5);
    			append_dev(div12, t75);
    			append_dev(div12, p);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input_handler*/ ctx[15], false, false, false),
    					listen_dev(input1, "input", /*input_handler_1*/ ctx[16], false, false, false),
    					listen_dev(input2, "input", /*input_handler_2*/ ctx[17], false, false, false),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[18]),
    					listen_dev(input4, "input", /*input_handler_3*/ ctx[19], false, false, false),
    					listen_dev(input5, "change", /*input5_change_handler*/ ctx[20]),
    					listen_dev(input6, "input", /*input_handler_4*/ ctx[21], false, false, false),
    					listen_dev(input7, "input", /*input_handler_5*/ ctx[22], false, false, false),
    					listen_dev(input8, "change", /*input8_change_handler*/ ctx[23]),
    					listen_dev(select0, "input", /*input_handler_6*/ ctx[24], false, false, false),
    					listen_dev(select1, "input", /*input_handler_7*/ ctx[25], false, false, false),
    					listen_dev(button, "click", /*emptyForm*/ ctx[14], false, false, false),
    					listen_dev(form, "submit", prevent_default(/*onSubmit*/ ctx[13]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div11, t2);
    				}
    			}

    			if (dirty & /*id_or_class*/ 512) {
    				input3.checked = /*id_or_class*/ ctx[9];
    			}

    			if (dirty & /*symbols*/ 1024) {
    				input5.checked = /*symbols*/ ctx[10];
    			}

    			if (dirty & /*symbols*/ 1024 && input6_disabled_value !== (input6_disabled_value = !/*symbols*/ ctx[10])) {
    				prop_dev(input6, "disabled", input6_disabled_value);
    			}

    			if (dirty & /*symbols*/ 1024 && input7_disabled_value !== (input7_disabled_value = !/*symbols*/ ctx[10])) {
    				prop_dev(input7, "disabled", input7_disabled_value);
    			}

    			if (dirty & /*int_or_float*/ 256) {
    				input8.checked = /*int_or_float*/ ctx[8];
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			if (if_block) {
    				if_block.d();
    			}

    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let email, url, title, data_id;
    	let success = false;
    	let error = false;
    	let notifications = 10;
    	let period = 1;
    	let int_or_float = false;
    	let id_or_class = false;
    	let symbols = false;
    	let index_start = 0;
    	let index_end = 0;

    	const onSubmit = async () => {
    		const response = await fetch("http://localhost:8000", {
    			method: "POST",
    			headers: {
    				"Accept": "application/json",
    				"Content-Type": "application/json"
    			},
    			body: JSON.stringify({
    				title,
    				email,
    				period,
    				url,
    				notif_time: notifications,
    				data_id,
    				id_or_class,
    				int_or_float,
    				symbols,
    				index_start,
    				index_end
    			})
    		}).then(res => {
    			$$invalidate(5, error = false);
    			$$invalidate(4, success = true);
    			console.log(res);
    		}).catch(err => {
    			$$invalidate(4, success = false);
    			$$invalidate(5, error = true);
    			console.log(res);
    		});
    	};

    	const emptyForm = () => {
    		document.getElementById("title").value = "";
    		document.getElementById("email").value = "";
    		document.getElementById("url").value = "";
    		document.getElementById("notif_time").value = "";
    		document.getElementById("data_id").value = "";
    		document.getElementById("id_or_class").checked = false;
    		document.getElementById("int_or_float").checked = false;
    		document.getElementById("symbols").checked = false;
    		document.getElementById("index_start").value = 0;
    		document.getElementById("index_end").value = 0;
    		$$invalidate(2, title = undefined);
    		$$invalidate(0, email = undefined);
    		$$invalidate(7, period = 1);
    		$$invalidate(1, url = undefined);
    		notif_time = 10;
    		$$invalidate(3, data_id = undefined);
    		$$invalidate(9, id_or_class = false);
    		$$invalidate(8, int_or_float = false);
    		$$invalidate(10, symbols = false);
    		$$invalidate(11, index_start = 0);
    		$$invalidate(12, index_end = 0);
    		$$invalidate(6, notifications = 10);
    		$$invalidate(7, period = 1);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const input_handler = e => $$invalidate(0, email = e.target.value);
    	const input_handler_1 = e => $$invalidate(2, title = e.target.value);
    	const input_handler_2 = e => $$invalidate(1, url = e.target.value);

    	function input3_change_handler() {
    		id_or_class = this.checked;
    		$$invalidate(9, id_or_class);
    	}

    	const input_handler_3 = e => $$invalidate(3, data_id = e.target.value);

    	function input5_change_handler() {
    		symbols = this.checked;
    		$$invalidate(10, symbols);
    	}

    	const input_handler_4 = e => $$invalidate(11, index_start = e.target.value);
    	const input_handler_5 = e => $$invalidate(12, index_end = e.target.value);

    	function input8_change_handler() {
    		int_or_float = this.checked;
    		$$invalidate(8, int_or_float);
    	}

    	const input_handler_6 = e => $$invalidate(6, notifications = e.target.value);
    	const input_handler_7 = e => $$invalidate(7, period = e.target.value);

    	$$self.$capture_state = () => ({
    		email,
    		url,
    		title,
    		data_id,
    		success,
    		error,
    		notifications,
    		period,
    		int_or_float,
    		id_or_class,
    		symbols,
    		index_start,
    		index_end,
    		onSubmit,
    		emptyForm
    	});

    	$$self.$inject_state = $$props => {
    		if ("email" in $$props) $$invalidate(0, email = $$props.email);
    		if ("url" in $$props) $$invalidate(1, url = $$props.url);
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("data_id" in $$props) $$invalidate(3, data_id = $$props.data_id);
    		if ("success" in $$props) $$invalidate(4, success = $$props.success);
    		if ("error" in $$props) $$invalidate(5, error = $$props.error);
    		if ("notifications" in $$props) $$invalidate(6, notifications = $$props.notifications);
    		if ("period" in $$props) $$invalidate(7, period = $$props.period);
    		if ("int_or_float" in $$props) $$invalidate(8, int_or_float = $$props.int_or_float);
    		if ("id_or_class" in $$props) $$invalidate(9, id_or_class = $$props.id_or_class);
    		if ("symbols" in $$props) $$invalidate(10, symbols = $$props.symbols);
    		if ("index_start" in $$props) $$invalidate(11, index_start = $$props.index_start);
    		if ("index_end" in $$props) $$invalidate(12, index_end = $$props.index_end);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		email,
    		url,
    		title,
    		data_id,
    		success,
    		error,
    		notifications,
    		period,
    		int_or_float,
    		id_or_class,
    		symbols,
    		index_start,
    		index_end,
    		onSubmit,
    		emptyForm,
    		input_handler,
    		input_handler_1,
    		input_handler_2,
    		input3_change_handler,
    		input_handler_3,
    		input5_change_handler,
    		input_handler_4,
    		input_handler_5,
    		input8_change_handler,
    		input_handler_6,
    		input_handler_7
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
