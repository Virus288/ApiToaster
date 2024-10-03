clean:
	rm -rf ./lib \
	rm tsconfig.tsbuildinfo \
	rm tsconfig.release.tsbuildinfo

test:
	clear \
	&& npm run test:unit \
	&& npm run test:e2e

