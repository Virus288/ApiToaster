clean:
	rm -rf ./lib && rm tsconfig.tsbuildinfo

test:
	clear \
	&& npm run test:unit \
	&& npm run test:e2e

