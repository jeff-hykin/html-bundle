deno run -A ../main/html-bundle.js --shouldBundleCss false ../test_content/test1/index.html ../logs/cli_test1/index.no_css.html
deno run -A ../main/html-bundle.js --shouldBundleScripts false ../test_content/test1/index.html ../logs/cli_test1/index.no_scripts.html
deno run -A ../main/html-bundle.js --shouldBundleImages false ../test_content/test1/index.html ../logs/cli_test1/index.no_images.html