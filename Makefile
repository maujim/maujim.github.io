format-html:
	pnpm dlx prettier index.html --write

run-dev: redbean.com
	cp redbean.com dev.com
	zip dev.com ./index.html
	zip -r dev.com ./assets ./javascript ./css

	chmod +x dev.com
	./dev.com

redbean.com:
	curl -f https://redbean.dev/redbean-2.2.com -o redbean.com

