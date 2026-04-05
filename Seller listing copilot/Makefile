.PHONY: dev db seed test

dev:
	docker-compose up -d
	npm run build --workspace=@listingpilot/channel-schemas --workspace=@listingpilot/shared-types --workspace=@listingpilot/ml-utils
	npm run dev --workspace=apps/api &
	npm run dev --workspace=apps/web

db:
	npm run prisma:migrate --workspace=apps/api
	npm run prisma:generate --workspace=apps/api

seed:
	npm run prisma:seed --workspace=apps/api

test:
	npm run test --workspace=apps/api

test-e2e:
	npm run test:e2e --workspace=apps/api

down:
	docker-compose down

clean:
	docker-compose down -v
	rm -rf apps/web/.next apps/api/dist node_modules
