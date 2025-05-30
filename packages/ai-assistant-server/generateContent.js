const fs = require('fs');
const path = require('path');

// Directory to scan
const srcDir = path.join(__dirname, 'src');

// Output file to store the result
const outputFile = path.join(__dirname, 'output.txt');

// List of folders or files to ignore
const ignoreList = [
  'migrations',    // Example folder to ignore
  'seed',            // Example hidden folder to ignore
  'output.txt',
];

// Function to check if a file or folder should be ignored
function shouldIgnore(filePath) {
  return ignoreList.some(ignoreItem => filePath.includes(ignoreItem));
}

// Function to traverse through the directory recursively
function traverseDirectory(dir, callback) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${dir}`, err);
      return;
    }
    files.forEach((file) => {
      const filePath = path.join(dir, file);

      // Skip files or folders in the ignore list
      if (shouldIgnore(filePath)) {
        return;
      }

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error stating file: ${filePath}`, err);
          return;
        }
        if (stats.isDirectory()) {
          traverseDirectory(filePath, callback); // Recursively traverse subdirectories
        } else if (stats.isFile()) {
          callback(filePath);
        }
      });
    });
  });
}

// Function to read the file content and format it
function processFile(filePath) {
  fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) {
      console.error(`Error reading file: ${filePath}`, err);
      return;
    }
    const relativePath = path.relative(__dirname, filePath);
    const formattedText = `// ${relativePath}\n\n${content}\n\n`;
    fs.appendFile(outputFile, formattedText, (err) => {
      if (err) {
        console.error(`Error writing to output file: ${outputFile}`, err);
      }
    });
  });
}

// Start processing
fs.writeFile(outputFile, '', (err) => { // Clear or create the output file
  if (err) {
    console.error(`Error creating/clearing the output file: ${outputFile}`, err);
    return;
  }
  traverseDirectory(srcDir, processFile);
});
