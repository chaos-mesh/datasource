VERSION=$1

rm -rf dist
rm -rf chaosmeshorg-datasource

echo "Bundled Version: $VERSION"
echo "Start to build..."
echo

yarn build
# yarn sign

echo "Bundling..."
echo

cp -r dist chaosmeshorg-datasource
zip -r chaosmeshorg-datasource-$VERSION.zip chaosmeshorg-datasource -x "*.DS_Store*"
md5sum chaosmeshorg-datasource-2.1.0.zip > chaosmeshorg-datasource-2.1.0.zip.md5
