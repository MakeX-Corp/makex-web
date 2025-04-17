export const toolStates = {
  readFile: {
    "partial-call": "Reading file contents",
    call: "Reading file contents",
    result: "File contents read",
    error: "Unable to read file contents",
  },
  listDirectory: {
    "partial-call": "Listing files in directory",
    call: "Listing files in directory",
    result: "Files listed",
    error: "Unable to list directory contents",
  },
  createDirectory: {
    "partial-call": "Creating new directory",
    call: "Creating new directory",
    result: "Directory created",
    error: "Unable to create directory",
  },
  deleteDirectory: {
    "partial-call": "Deleting directory and its contents",
    call: "Deleting directory and its contents",
    result: "Directory deleted",
    error: "Unable to delete directory",
  },
  installPackages: {
    "partial-call": "Installing packages",
    call: "Installing packages",
    result: "Packages installed",
    error: "Unable to install packages",
  },
  insertText: {
    "partial-call": "Inserting text into file",
    call: "Inserting text into file",
    result: "Text inserted",
    error: "Unable to insert text",
  },
  writeFile: {
    "partial-call": "Writing content to file",
    call: "Writing content to file",
    result: "File written",
    error: "Unable to write file",
  },
  deleteFile: {
    "partial-call": "Deleting file",
    call: "Deleting file",
    result: "File deleted",
    error: "Unable to delete file",
  },
  replaceInFile: {
    "partial-call": "Replacing text in file",
    call: "Replacing text in file",
    result: "Text replaced",
    error: "Unable to replace text",
  },
  getFileTree: {
    "partial-call": "Getting directory tree structure",
    call: "Getting directory tree structure",
    result: "Directory tree retrieved",
    error: "Unable to get directory tree",
  },
  runSql: {
    "partial-call": "Running SQL query",
    call: "Running SQL query",
    result: "SQL query executed",
    error: "Unable to execute SQL query",
  },
} as const;

export type ToolName = keyof typeof toolStates;
export type ToolState = "call" | "result" | "error";
