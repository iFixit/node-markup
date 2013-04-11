#!/usr/bin/python

import os;
import sys;
import subprocess;
import glob;
import re as regex;

testDirectory = "./test/";

# These metrics print out Absoulte columns, which is expected.
supportedMetrics = ["mae", "mse", "rmse", "pae"];

def readMarkupFile(markupFilename):
   f = open(markupFilename, 'r');
   markup = f.read();
   return markup;

def processComparison(compareOutput):
   # Sample compareOutput:

   # Image Difference (MeanAbsoluteError):
   #            Normalized    Absolute
   #           ============  ==========
   #      Red: 0.0000000000        0.0
   #    Green: 0.0000000000        0.0
   #     Blue: 0.0000000000        0.0
   #    Total: 0.0000000000        0.0

   channelNameIndex = 0;
   absoluteColumnIndex = 2;
   totalChannelName = 'Total:';

   for line in compareOutput.split('\n'):
      # Strip trailing and leading spaces and replace multiple spaces
      # for parsing
      lineSet = regex.sub(r'\s+', ' ', line.strip()).split(' ');
      if lineSet[channelNameIndex] == totalChannelName:
         absoluteError = lineSet[absoluteColumnIndex];
         return absoluteError;

   # If we're here, the Total line did not exist as expected
   errMsg = totalChannelName + ' row not found in comparison.';
   raise RuntimeError(errMsg);


def compareOutputs(basename, oracleFilename, destinationFilename):
   metric = "mae";

   if metric not in supportedMetrics:
      errMsg = metric + " is not a supported metric.";
      raise RuntimeError(errMsg);

   cmd = ["gm","compare","-metric",metric,oracleFilename,destinationFilename];

   proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE);
   (out, err) = proc.communicate();

   retCode = proc.returncode;
   if retCode != 0:
      errMsg = "Compare invocation failed with exit code: " + str(retCode);
      raise RuntimeError(errMsg);

   try:
      absoluteError = float(processComparison(out));

      if absoluteError != 0.0:
         errMsg = basename + ': Image difference error = ' + str(absoluteError);
         raise RuntimeError(errMsg);
      else:
         print basename + ': test comparison passed.';
         os.remove(destinationFilename);
   except RuntimeError, runtimeErr:
      errMsg = basename + ': Comparison string processing failed\n' \
         + str(runtimeErr);

      raise RuntimeError(errMsg);


def runNode(sourceFilename, destinationFilename, markupFilename):
   markup = readMarkupFile(markupFilename);

   cmd = "node ImageMarkupCall.js --input " + sourceFilename + " --output " + \
      destinationFilename + " --markup \"" + markup + "\"";

   ret = os.system(cmd);

   if ret != 0:
      errMsg = 'node-markup invocation failed';
      raise RuntimeError(errMsg);

   return ret == 0;

for filename in os.listdir(testDirectory):
   if filename.endswith(".markup"):
      markupFilename = testDirectory + filename;
      basename = regex.sub(r'(.+)\.markup', r'\1', filename);
      sourceFilename = testDirectory + basename + '.source.jpg';
      oracleFilename = testDirectory + basename + '.node.oracle.jpg';
      testFilename = testDirectory + basename + '.node.test.jpg';

      try:
         success = runNode(sourceFilename, testFilename, markupFilename);

         if success:
            compareOutputs(basename, oracleFilename, testFilename);

      except RuntimeError, msg:
         print >> sys.stderr, basename + ':', msg;
         continue;
