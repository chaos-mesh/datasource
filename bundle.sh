VERSION=$1

echo "Bundled Version: $VERSION"
echo "Start to build..."
echo

yarn build

echo "Bundling..."
echo

cp -r dist yeya24-chaosmesh-datasource
zip -r yeya24-chaosmesh-datasource-$VERSION.zip yeya24-chaosmesh-datasource -x "*.DS_Store*"
