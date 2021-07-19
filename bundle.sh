VERSION=$1

rm -rf dist
rm -rf yeya24-chaosmesh-datasource

echo "Bundled Version: $VERSION"
echo "Start to build..."
echo

yarn build
yarn sign --rootUrls https://grafana.com

echo "Bundling..."
echo

cp -r dist yeya24-chaosmesh-datasource
zip -r yeya24-chaosmesh-datasource-$VERSION.zip yeya24-chaosmesh-datasource -x "*.DS_Store*"
