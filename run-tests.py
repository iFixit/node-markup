#!/usr/bin/python

import os;
import glob;
import re as regex;

testDirectory = "./test/";

def readMarkupFile(markupFilename):
   f = open(markupFilename, 'r');
   markup = f.read();
   return markup;

def runNode(sourceFilename, destinationFilename, markupFilename):
   markup = readMarkupFile(markupFilename);

   cmd = "node ImageMarkupCall.js --input " + sourceFilename + " --output " + \
      destinationFilename + " --markup \"" + markup + "\"";

   ret = os.system(cmd);

   if ret != 0:
      sys.stderr.write('node-markup encountered an error while processing ' \
         + sourceFilename);
   else:
      print(sourceFilename + ' -> ' + destinationFilename);

for filename in os.listdir(testDirectory):
   if filename.endswith(".markup"):
         markupFilename = testDirectory + filename;
         basename = regex.sub(r'(.+)\.markup', r'\1', filename);
         sourceFilename = testDirectory + basename + '.source.jpg';
         oracle = testDirectory + basename + '.node.oracle.jpg';
         testFilename = testDirectory + basename + '.node.test.jpg';

         runNode(sourceFilename, testFilename, markupFilename);
