#!/bin/bash

#######################################
#          Sample Run Script          #
#######################################

DIR=$(cd `dirname "${BASH_SOURCE[0]}"` && pwd)
cd $DIR

# NODE_PATH is for finding node modules in different locations. If you did not
# install modules to locations other than this folder, you may comment this
# line out
export NODE_PATH=/usr/local/share/node-markup/node_modules:/usr/local/lib/node_modules
node $DIR/ImageMarkupCall.js $@
