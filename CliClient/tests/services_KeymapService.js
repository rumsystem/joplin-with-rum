require('app-module-path').addPath(__dirname);

const KeymapService = require('lib/services/KeymapService').default;
const keymapService = KeymapService.instance();

describe('services_KeymapService', () => {
	describe('validateAccelerator', () => {
		it('should identify valid Accelerators', () => {
			const testCases = {
				darwin: [
					'F4',
					'Cmd+F9',
					'Option+Z',
					'Option+Shift+F',
					'Ctrl+Option+U',
					'Option+Shift+Cmd+F9',
					'Ctrl+Shift+Z',
					'Option+Shift+Cmd+B',
				],
				linux: [
					'F4',
					'Ctrl+F9',
					'Alt+Shift+F',
					'Shift+U',
					'Ctrl+Shift+T',
					'Ctrl+Alt+Shift+Z',
					'Alt+E',
					'Alt+Shift+F9',
				],
			};

			Object.entries(testCases).forEach(([platform, accelerators]) => {
				keymapService.initialize(platform);
				accelerators.forEach(accelerator => {
					expect(() => keymapService.validateAccelerator(accelerator)).not.toThrow();
				});
			});
		});

		it('should identify invalid Accelerators', () => {
			const testCases = {
				darwin: [
					'',
					'A+Z',
					'Cmd',
					'Ctrl+',
					'Option+Cmd',
					'Ctrl+Shift',
					'Cmd+H+A',
					'Option+Shift+Cmd+J+O+P',
					'Opptionn+F9',
					'Ctrl+Shiftt+X',
					'Cmd+Option+Shoft+T',
				],
				win32: [
					'+',
					'B+F4',
					'Ctrl+',
					'Ctrl+Shift+',
					'Cmd+Alt',
					'Ctrl+Shift+Alt',
					'Cmd+H+A',
					'Ctrl+Shift+Alt+J+O+P',
					'Contrl+F9',
					'Controller+Shift+X',
					'Cmd+Option+Shoft+T',
				],
			};

			Object.entries(testCases).forEach(([platform, accelerators]) => {
				keymapService.initialize(platform);
				accelerators.forEach(accelerator => {
					expect(() => keymapService.validateAccelerator(accelerator)).toThrow();
				});
			});
		});
	});

	describe('getAccelerator', () => {
		beforeEach(() => keymapService.initialize());

		it('should return the platform-specific default Accelerator', () => {
			keymapService.initialize('darwin');
			expect(keymapService.getAccelerator('newNote')).toEqual('Cmd+N');
			expect(keymapService.getAccelerator('synchronize')).toEqual('Cmd+S');
			expect(keymapService.getAccelerator('textSelectAll')).toEqual('Cmd+A');
			expect(keymapService.getAccelerator('textBold')).toEqual('Cmd+B');

			keymapService.initialize('linux');
			expect(keymapService.getAccelerator('newNote')).toEqual('Ctrl+N');
			expect(keymapService.getAccelerator('synchronize')).toEqual('Ctrl+S');

			keymapService.initialize('win32');
			expect(keymapService.getAccelerator('textSelectAll')).toEqual('Ctrl+A');
			expect(keymapService.getAccelerator('textBold')).toEqual('Ctrl+B');
		});

		if ('should throw when an invalid command is requested', () => {
			expect(() => keymapService.getAccelerator('totallyNonExistentCommand')).toThrow();
		});
	});

	describe('setAccelerator', () => {
		beforeEach(() => keymapService.initialize());

		it('should update the Accelerator', () => {
			keymapService.initialize('darwin');
			const testCases_Darwin = [
				{ command: 'newNote', accelerator: 'Ctrl+Option+Shift+N' },
				{ command: 'synchronize', accelerator: 'F11' },
				{ command: 'textBold', accelerator: 'Shift+F5' },
				{ command: 'showLocalSearch', accelerator: 'Option+Cmd+S' },
				{ command: 'gotoAnything', accelerator: 'Ctrl+Shift+G' },
				{ command: 'print', accelerator: null /* Disabled */ },
				{ command: 'focusElementNoteTitle', accelerator: 'Option+Shift+Cmd+T' },
				{ command: 'focusElementNoteBody', accelerator: 'Ctrl+Option+Shift+Cmd+B' },
			];

			testCases_Darwin.forEach(({ command, accelerator }) => {
				keymapService.setAccelerator(command, accelerator);
				expect(keymapService.getAccelerator(command)).toEqual(accelerator);
			});

			keymapService.initialize('linux');
			const testCases_Linux = [
				{ command: 'newNote', accelerator: 'Ctrl+Alt+Shift+N' },
				{ command: 'synchronize', accelerator: 'F15' },
				{ command: 'textBold', accelerator: 'Shift+F5' },
				{ command: 'showLocalSearch', accelerator: 'Ctrl+Alt+S' },
				{ command: 'gotoAnything', accelerator: 'Ctrl+Shift+G' },
				{ command: 'print', accelerator: null /* Disabled */ },
				{ command: 'focusElementNoteTitle', accelerator: 'Ctrl+Alt+Shift+T' },
				{ command: 'focusElementNoteBody', accelerator: 'Ctrl+Alt+Shift+B' },
			];

			testCases_Linux.forEach(({ command, accelerator }) => {
				keymapService.setAccelerator(command, accelerator);
				expect(keymapService.getAccelerator(command)).toEqual(accelerator);
			});
		});
	});

	describe('getDefaultAccelerator', () => {
		beforeEach(() => keymapService.initialize());

		it('should return the default accelerator', () => {
			const testCases = [
				{ command: 'newNote', accelerator: 'Ctrl+Alt+Shift+N' },
				{ command: 'synchronize', accelerator: null /* Disabled */ },
				{ command: 'textBold', accelerator: 'Shift+F5' },
				{ command: 'showLocalSearch', accelerator: 'Ctrl+Alt+S' },
				{ command: 'gotoAnything', accelerator: 'Ctrl+Shift+G' },
				{ command: 'print', accelerator: 'Alt+P' },
				{ command: 'focusElementNoteTitle', accelerator: 'Ctrl+Alt+Shift+T' },
				{ command: 'focusElementNoteBody', accelerator: 'Ctrl+Alt+Shift+B' },
			];

			testCases.forEach(({ command, accelerator }) => {
				// Remember the real default Accelerator value
				const defaultAccelerator = keymapService.getAccelerator(command);

				// Update the Accelerator and then retrieve the default accelerator
				keymapService.setAccelerator(command, accelerator);
				expect(keymapService.getDefaultAccelerator(command)).toEqual(defaultAccelerator);
			});
		});
	});

	describe('overrideKeymap', () => {
		beforeEach(() => keymapService.initialize());

		it('should update the keymap', () => {
			keymapService.initialize('darwin');
			const customKeymapItems_Darwin = [
				{ command: 'newNote', accelerator: 'Option+Shift+Cmd+N' },
				{ command: 'synchronize', accelerator: 'Ctrl+F11' },
				{ command: 'textBold', accelerator: 'Shift+F5' },
				{ command: 'showLocalSearch', accelerator: 'Ctrl+Option+S' },
				{ command: 'gotoAnything', accelerator: 'Ctrl+Shift+G' },
				{ command: 'print', accelerator: 'Option+P' },
				{ command: 'help', accelerator: null /* Disabled */ },
				{ command: 'focusElementNoteTitle', accelerator: 'Ctrl+Option+Shift+T' },
				{ command: 'focusElementNoteBody', accelerator: 'Option+Shift+Cmd+B' },
				{ command: 'focusElementSideBar', accelerator: 'Shift+Cmd+L' /* Default of focusElementNoteList */ },
				{ command: 'focusElementNoteList', accelerator: 'Shift+Cmd+S' /* Default of focusElementSideBar */ },
			];

			expect(() => keymapService.overrideKeymap(customKeymapItems_Darwin)).not.toThrow();
			customKeymapItems_Darwin.forEach(({ command, accelerator }) => {
				// Also check if keymap is updated or not
				expect(keymapService.getAccelerator(command)).toEqual(accelerator);
			});

			keymapService.initialize('win32');
			const customKeymapItems_Win32 = [
				{ command: 'newNote', accelerator: 'Ctrl+Alt+Shift+N' },
				{ command: 'synchronize', accelerator: 'Ctrl+F11' },
				{ command: 'textBold', accelerator: 'Shift+F5' },
				{ command: 'showLocalSearch', accelerator: 'Ctrl+Alt+S' },
				{ command: 'gotoAnything', accelerator: 'Ctrl+Shift+G' },
				{ command: 'print', accelerator: 'Alt+P' },
				{ command: 'help', accelerator: null /* Disabled */ },
				{ command: 'focusElementNoteTitle', accelerator: 'Ctrl+Alt+Shift+T' },
				{ command: 'focusElementNoteBody', accelerator: 'Ctrl+Alt+Shift+B' },
				{ command: 'focusElementSideBar', accelerator: 'Ctrl+Shift+L' /* Default of focusElementNoteList */ },
				{ command: 'focusElementNoteList', accelerator: 'Ctrl+Shift+S' /* Default of focusElementSideBar */ },
			];

			expect(() => keymapService.overrideKeymap(customKeymapItems_Win32)).not.toThrow();
			customKeymapItems_Win32.forEach(({ command, accelerator }) => {
				// Also check if keymap is updated or not
				expect(keymapService.getAccelerator(command)).toEqual(accelerator);
			});
		});

		it('should throw when the required properties are missing', () => {
			const customKeymaps = [
				[
					{ commmmmand: 'gotoAnything', accelerator: 'Ctrl+Shift+G' },
					{ command: 'showLocalSearch', accelerator: 'Ctrl+Alt+S' },
					{ command: 'print', accelerator: 'Alt+P' },
				],
				[
					{ accelerator: 'Alt+P' },
					{ command: 'showLocalSearch', accelerator: 'Ctrl+Alt+S' },
					{ command: 'gotoAnything', accelerator: 'Ctrl+Shift+G' },
				],
				[
					{ command: 'showLocalSearch', accel: 'Ctrl+Alt+S' },
					{ command: 'print', accelerator: 'Alt+P' },
					{ command: 'gotoAnything', accelerator: 'Ctrl+Shift+G' },
				],
				[
					{ command: 'print' },
					{ command: 'showLocalSearch', accelerator: 'Ctrl+Alt+S' },
					{ command: 'gotoAnything', accelerator: 'Ctrl+Shift+G' },
				],
			];

			for (let i = 0; i < customKeymaps.length; i++) {
				const customKeymapItems = customKeymaps[i];
				expect(() => keymapService.overrideKeymap(customKeymapItems)).toThrow();
			}
		});

		it('should throw when the provided Accelerators are invalid', () => {
			// Only one test case is provided since KeymapService.validateAccelerator() is already tested
			const customKeymapItems = [
				{ command: 'gotoAnything', accelerator: 'Ctrl+Shift+G' },
				{ command: 'print', accelerator: 'Alt+P' },
				{ command: 'focusElementNoteTitle', accelerator: 'Ctrl+Alt+Shift+J+O+P+L+I+N' },
			];

			expect(() => keymapService.overrideKeymap(customKeymapItems)).toThrow();
		});

		it('should throw when the provided commands are invalid', () => {
			const customKeymapItems = [
				{ command: 'totallyInvalidCommand', accelerator: 'Ctrl+Shift+G' },
				{ command: 'print', accelerator: 'Alt+P' },
				{ command: 'focusElementNoteTitle', accelerator: 'Ctrl+Alt+Shift+J' },
			];

			expect(() => keymapService.overrideKeymap(customKeymapItems)).toThrow();
		});

		it('should throw when duplicate accelerators are provided', () => {
			const customKeymaps_Darwin = [
				[
					{ command: 'showLocalSearch', accelerator: 'Option+Cmd+S' /* Duplicate */ },
					{ command: 'gotoAnything', accelerator: 'Option+Cmd+S' /* Duplicate */ },
					{ command: 'print', accelerator: 'Option+P' },
				],
				[
					{ command: 'showLocalSearch', accelerator: 'Option+Cmd+S' },
					{ command: 'print', accelerator: 'Cmd+G' /* Default of gotoAnything */ },
					{ command: 'focusElementNoteTitle', accelerator: 'Option+Shift+Cmd+J' },
				],
			];

			for (let i = 0; i < customKeymaps_Darwin.length; i++) {
				const customKeymapItems = customKeymaps_Darwin[i];
				expect(() => keymapService.overrideKeymap(customKeymapItems)).toThrow();
			}

			const customKeymaps_Linux = [
				[
					{ command: 'showLocalSearch', accelerator: 'Ctrl+Alt+S' /* Duplicate */ },
					{ command: 'print', accelerator: 'Alt+P' },
					{ command: 'gotoAnything', accelerator: 'Ctrl+Alt+S' /* Duplicate */ },
				],
				[
					{ command: 'showLocalSearch', accelerator: 'Ctrl+Alt+S' },
					{ command: 'print', accelerator: 'Ctrl+G' /* Default of gotoAnything */ },
					{ command: 'focusElementNoteTitle', accelerator: 'Ctrl+Alt+Shift+J' },
				],
			];

			for (let i = 0; i < customKeymaps_Linux.length; i++) {
				const customKeymapItems = customKeymaps_Linux[i];
				expect(() => keymapService.overrideKeymap(customKeymapItems)).toThrow();
			}
		});
	});
});
