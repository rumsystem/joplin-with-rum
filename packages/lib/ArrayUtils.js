const ArrayUtils = {};

ArrayUtils.unique = function(array) {
	return array.filter(function(elem, index, self) {
		return index === self.indexOf(elem);
	});
};

ArrayUtils.removeElement = function(array, element) {
	const index = array.indexOf(element);
	if (index < 0) return array;
	const newArray = array.slice();
	newArray.splice(index, 1);
	return newArray;
};

// https://stackoverflow.com/a/10264318/561309
ArrayUtils.binarySearch = function(items, value) {
	let startIndex = 0,
		stopIndex = items.length - 1,
		middle = Math.floor((stopIndex + startIndex) / 2);

	while (items[middle] != value && startIndex < stopIndex) {
		// adjust search area
		if (value < items[middle]) {
			stopIndex = middle - 1;
		} else if (value > items[middle]) {
			startIndex = middle + 1;
		}

		// recalculate middle
		middle = Math.floor((stopIndex + startIndex) / 2);
	}

	// make sure it's the right value
	return items[middle] != value ? -1 : middle;
};

ArrayUtils.findByKey = function(array, key, value) {
	for (let i = 0; i < array.length; i++) {
		const o = array[i];
		if (typeof o !== 'object') continue;
		if (o[key] === value) return o;
	}
	return null;
};

ArrayUtils.contentEquals = function(array1, array2) {
	if (array1 === array2) return true;
	if (!array1.length && !array2.length) return true;
	if (array1.length !== array2.length) return false;

	for (let i = 0; i < array1.length; i++) {
		const a1 = array1[i];
		if (array2.indexOf(a1) < 0) return false;
	}

	return true;
};

// Merges multiple overlapping intervals into a single interval
// e.g. [0, 25], [20, 50], [75, 100] --> [0, 50], [75, 100]
ArrayUtils.mergeOverlappingIntervals = function(intervals, limit) {
	intervals.sort((a, b) => a[0] - b[0]);

	const stack = [];
	if (intervals.length) {
		stack.push(intervals[0]);
		for (let i = 1; i < intervals.length && stack.length < limit; i++) {
			const top = stack[stack.length - 1];
			if (top[1] < intervals[i][0]) {
				stack.push(intervals[i]);
			} else if (top[1] < intervals[i][1]) {
				top[1] = intervals[i][1];
				stack.pop();
				stack.push(top);
			}
		}
	}
	return stack;
};

ArrayUtils.shuffle = function(array) {
	array = array.slice();
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return array;
};

module.exports = ArrayUtils;
