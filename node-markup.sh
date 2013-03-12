#!/bin/sh

#######################################
#          Sample Run Script          #
#######################################

# Kill environment for clean running
unset $(/usr/bin/env | egrep '^(\w+)=(.*)$' | \
   egrep -vw 'PWD|USER|LANG' | /usr/bin/cut -d= -f1);

PATH=/usr/bin

DIR=$(cd `dirname "${BASH_SOURCE[0]}"` && pwd)
cd $DIR

# NODE_PATH is for finding node modules in different locations. If you did not
# install modules to locations other than this folder, you may comment this
# line out
export NODE_PATH=/usr/local/share/node-markup/node_modules:/usr/local/lib/node_modules
/mnt/ebs/bin/node $DIR/ImageMarkupCall.js $@
