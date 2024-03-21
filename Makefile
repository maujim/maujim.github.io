run-dev: build-dev
	./dev.com

.PHONY:
build-dev: dev.com
	zip dev.com ./index.html
	zip -r dev.com ./assets ./javascript ./css

dev.com: redbean.com
	cp redbean.com dev.com
	chmod +x dev.com

redbean.com:
	curl -f https://redbean.dev/redbean-2.2.com -o redbean.com

