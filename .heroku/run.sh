#!bin/bash

cd "$BUILD_DIR/frontend/" && npm install && npm run build
echo "static files build"
if [ -d "$BUILD_DIR/build" ]; then
    rm -rf "$BUILD_DIR/build"
    echo "previous build deleted"
fi
mv "$BUILD_DIR/frontend/build" $BUILD_DIR
echo "react bundle moved"