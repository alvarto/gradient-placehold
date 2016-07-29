var $ = (function () {
	var map = {};
	return function (selector) {
		if (!(selector in map)) {
			var elem = document.querySelector(selector);
			if (!elem) {
				return null;
			}
			map[selector] = elem;
		}
		return map[selector];
	}
})();

function fileToImg(file) {
	var lastUrl;
	return new Promise(function (resolve, reject) {
		var img = new Image;
		lastUrl && URL.revokeObjectURL(lastUrl);
		lastUrl = file;
		var src = URL.createObjectURL(file);
		img.onload = function () {
			resolve(img);
		};
		img.src = src;
	});
}

(function () {
	var calculating;
	var cachedImg;
	$('input').addEventListener("change", function () {
		// FileReader Apis
		var file = this.files && this.files[0];
		if (!file) {
			return;
		}

		if (calculating) {
			return;
		}

		$(".placehold").classList.remove("active");
		let img = document.querySelector("img");
		img && img.classList.remove("active");

		fileToImg(file)
			.then(function (img) {
				var pixels = [];
				var context = $("canvas").getContext('2d');
				context.clearRect(0, 0, $("canvas").width, $("canvas").height);
				context.drawImage(img, 0, 0);
				var data = context.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;
				var i = 0;

				while (i < data.length) {
					pixels.push([data[i], data[i + 1], data[i + 2]]);
					i += 4 * 5;
				}

				var calculated = (new MMCQ).quantize(pixels, 6);
				cachedImg && $("figure").removeChild(cachedImg);
				cachedImg = img;

				return calculated.cboxes.contents
					.map(content => content.color)
					.filter(colors => !(colors[0] < 30 && colors[1] < 30 && colors[2] < 30))
					.map(colors => `rgb(${colors.join(",")})`)
			})
			.then(colorSet => {
				$("ol").innerHTML = "";

				for (let color of colorSet) {
					let li = document.createElement("li");
					li.style.backgroundColor = color;
					$("ol").appendChild(li);
				}

				if (colorSet.length > 1) {
					$(".placehold").style.backgroundImage = `linear-gradient(135deg, ${colorSet[0]}, ${colorSet[1]})`;
				} else if (colorSet.length == 1) {
					$(".placehold").style.backgroundColor = colorSet[0];
				}
				$(".placehold").classList.add("active");
				$("figure").appendChild(cachedImg);

				setTimeout(function () {
					var next = $(".placehold").nextElementSibling;
					next && next.classList.add("active");
				}, 1000);
			})
			.catch(err => console.error(err))
			.then(() => {
				$('form').reset();
				calculating = false;
			});
	});
})();
