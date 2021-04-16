using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TestProject.Models
{
    public class FolderData
    {
        public string relativePath;
        public string[] folders;
        public string[] files;
    }

    public class FolderTree
    {
        public string path;
        public List<FolderTree> folders = new List<FolderTree>();
        public List<string> files;

        public FolderTree(string path, List<string> files)
        {
            this.path = path;
            this.files = files;
            this.folders = new List<FolderTree>();
        }

    }
}