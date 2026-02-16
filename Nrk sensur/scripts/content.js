(() => {
	let blockedPhrases = [];

	const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	const shouldRemoveText = (text) => {
		return blockedPhrases.some((phrase) => {
			const escaped = escapeRegex(phrase);
			const pattern = new RegExp(`\\b${escaped}\\b`, "i");
			return pattern.test(text);
		});
	};

	const loadPhrases = (callback) => {
		chrome.storage.sync.get(["blockedPhrases"], (result) => {
			blockedPhrases = result.blockedPhrases || [];
			if (callback) callback();
		});
	};

	const findRemovableContainer = (node) => {
		let current = node.parentElement;
		let highestDiv = null;
		while (current) {
			const tag = current.tagName;
			if (tag === "DIV") {
				highestDiv = current;
			}
			if (tag === "BODY" || tag === "HTML") {
				break;
			}
			current = current.parentElement;
		}
		return highestDiv || node.parentElement || null;
	};

	const cleanupEmptySections = (root) => {
		const sections = root.querySelectorAll("section");
		sections.forEach((section) => {
			const text = section.textContent.trim();
			if (!text) {
				section.remove();
			}
		});
	};

	const removeMatchesIn = (root) => {
		const walker = document.createTreeWalker(
			root,
			NodeFilter.SHOW_TEXT,
			{
				acceptNode: (node) => {
					if (!node.nodeValue || !node.nodeValue.trim()) {
						return NodeFilter.FILTER_REJECT;
					}
					return shouldRemoveText(node.nodeValue)
						? NodeFilter.FILTER_ACCEPT
						: NodeFilter.FILTER_REJECT;
				},
			}
		);

		const removals = new Set();
		while (walker.nextNode()) {
			const container = findRemovableContainer(walker.currentNode);
			if (container) {
				removals.add(container);
			}
		}

		removals.forEach((element) => element.remove());
		cleanupEmptySections(root);
	};

	const start = () => {
		const target = document.body;
		if (!target) {
			return;
		}

		removeMatchesIn(target);

		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType !== Node.ELEMENT_NODE) {
						return;
					}
					removeMatchesIn(node);
				});
			});
		});

		observer.observe(target, {
			childList: true,
			subtree: true,
		});
	};

	const listener = (changes, areaName) => {
		if (areaName === "sync" && changes.blockedPhrases) {
			blockedPhrases = changes.blockedPhrases.newValue || [];
			const target = document.body;
			if (target) {
				removeMatchesIn(target);
			}
		}
	};

	loadPhrases(() => {
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", start, { once: true });
		} else {
			start();
		}
	});

	chrome.storage.onChanged.addListener(listener);
})();