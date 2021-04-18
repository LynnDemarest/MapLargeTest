using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;
using System.Web.Mvc;
using TestProject.Models;
using Newtonsoft.Json;
using System.Configuration;

namespace TestProject.Controllers
{
    public class DefaultController : Controller
    {
        // GET: Default
        public ActionResult Test()
        {
            return Content("test");
        }


        //
        // Returns a JSON representation of the folder tree, without files. 
        // 
        //
        // 
        //
        [HttpPost]
        public JsonResult getFullDirectoryTree(string rootpath)
        {

            string newpath = Server.MapPath(Path.Combine(ConfigurationManager.AppSettings["rootFolder"], rootpath));

            DirectoryInfo di = new DirectoryInfo(newpath);
            FolderTree tree = WalkDirectoryTree(di);

            //return Json("Full tree here for " + rootpath);
            return Json(tree);
        }

        // RemoveRootFolder
        // Removes the server-mapped root folder from the path
        //
        private string RemoveRootFolder(string path)
        {
            string rootFolder = Server.MapPath(ConfigurationManager.AppSettings["rootFolder"]);

            string shortName = path.Replace(rootFolder, "");

            return shortName;
        }

        private FolderTree WalkDirectoryTree(System.IO.DirectoryInfo root)
        {
            string rootFolder = ConfigurationManager.AppSettings["rootFolder"];

            string shortName = RemoveRootFolder(root.FullName);
            FolderTree tree = new FolderTree(shortName, new List<string>()); ;

            System.IO.FileInfo[] files = null;
            System.IO.DirectoryInfo[] subDirs = null;

            // First, process all the files directly under this folder
            try
            {
                files = root.GetFiles("*.*");
            }
            // This is thrown if even one of the files requires permissions greater
            // than the application provides.
            catch (UnauthorizedAccessException e)
            {
                // This code just writes out the message and continues to recurse.
                // You may decide to do something different here. For example, you
                // can try to elevate your privileges and access the file again.
                // log.Add(e.Message);
                throw;
            }

            catch (System.IO.DirectoryNotFoundException e)
            {
                //Console.WriteLine(e.Message);
                throw;
            }

            if (files != null)
            {

                foreach (System.IO.FileInfo fi in files)
                {
                    // In this example, we only access the existing FileInfo object. If we
                    // want to open, delete or modify the file, then
                    // a try-catch block is required here to handle the case
                    // where the file has been deleted since the call to TraverseTree().
                    // Console.WriteLine(fi.FullName);
                    tree.files.Add(RemoveRootFolder(fi.FullName));
                }
            }
            // Now find all the subdirectories under this directory.
            subDirs = root.GetDirectories();
            if (subDirs != null)
            {
                foreach (System.IO.DirectoryInfo dirInfo in subDirs)
                {
                    // Resursive call for each subdirectory.
                    tree.folders.Add(WalkDirectoryTree(dirInfo));
                }
            }

            return tree;
        }



        [HttpPost]
        public JsonResult searchFolder(string searchphrase, string path)
        {
            try
            {
                if (!searchphrase.Contains("*"))
                {
                    searchphrase = $"*{searchphrase}*";
                }

                string newpath = Server.MapPath(Path.Combine(ConfigurationManager.AppSettings["rootFolder"], path));
                string[] files = Directory.GetFiles(newpath, searchphrase, SearchOption.AllDirectories);

                // remove the absolute part of the path for each file 
                string prefix = Server.MapPath(Path.Combine(ConfigurationManager.AppSettings["rootFolder"]));
                for (int x = 0; x < files.Count(); x++)
                {
                    files[x] = files[x].Replace(prefix, "");
                }

                return Json(files);
            }
            catch (Exception ex)
            {
                throw new Exception("Could not find path. Error was: " + ex.Message);
            }

        }

        //
        // Adds the new path, which is guaranteed to be one segment longer than an existing path.
        //
        public JsonResult AddFolder(string newfolderpath)
        {
            try
            {
                newfolderpath = Path.Combine(ConfigurationManager.AppSettings["rootFolder"], newfolderpath);
                System.IO.Directory.CreateDirectory(Server.MapPath(newfolderpath));
            }
            catch (Exception ex)
            {
                throw;
            }

            return Json($"{newfolderpath} created.");
        }
        //public JsonResult DeleteFolder(string folderpath)
        //{
        //    try
        //    {
        //        folderpath = Path.Combine(ConfigurationManager.AppSettings["rootFolder"], folderpath);
        //        System.IO.Directory.Delete(Server.MapPath(folderpath));
        //    }
        //    catch (Exception ex)
        //    {
        //        throw;
        //    }

        //    return Json($"{folderpath} deleted.");
        //}

        [HttpPost]
        public JsonResult MoveFolder(string fromfolderpath, string tofolderpath)
        {
            try
            {
                if (fromfolderpath == tofolderpath) throw new Exception("Can't move to the same location.");

                fromfolderpath = Path.Combine(ConfigurationManager.AppSettings["rootFolder"], fromfolderpath);
                string dirname = Path.GetFileName(fromfolderpath);
                if (dirname == "") dirname = "root";
                tofolderpath = Path.Combine(ConfigurationManager.AppSettings["rootFolder"], tofolderpath, dirname);
                fromfolderpath = Server.MapPath(fromfolderpath);
                tofolderpath = Server.MapPath(tofolderpath);

                System.IO.Directory.Move(fromfolderpath, tofolderpath);
            }
            catch (Exception ex)
            {
                return Json("Folder was not moved. " + ex.Message);
            }

            return Json($"Folder moved.");
        }

        [HttpPost]
        public JsonResult CopyFolder(string fromfolderpath, string tofolderpath)
        {
            try
            {
                fromfolderpath = Path.Combine(ConfigurationManager.AppSettings["rootFolder"], fromfolderpath);
                string dirname = Path.GetFileName(fromfolderpath);
                if (dirname == "") dirname = "root";
                tofolderpath = Path.Combine(ConfigurationManager.AppSettings["rootFolder"], tofolderpath, dirname);
                fromfolderpath = Server.MapPath(fromfolderpath);
                tofolderpath = Server.MapPath(tofolderpath);

                // TODO: Copy doesn't exist, so we have to write our own?
                // 
                DirectoryCopy(fromfolderpath, tofolderpath, true);
            }
            catch (Exception ex)
            {
                return Json("Error: " + ex.Message);
            }

            return Json($"Folder moved.");
        }


        // DirectoryCopy
        //
        // See: https://docs.microsoft.com/en-us/dotnet/standard/io/how-to-copy-directories
        //
        private void DirectoryCopy(string sourceDirName, string destDirName, bool copySubDirs)
        {
            // Get the subdirectories for the specified directory.
            DirectoryInfo dir = new DirectoryInfo(sourceDirName);

            if (!dir.Exists)
            {
                throw new DirectoryNotFoundException(
                    "Source directory does not exist or could not be found: "
                    + sourceDirName);
            }

            DirectoryInfo[] dirs = dir.GetDirectories();

            // If the destination directory doesn't exist, create it.       
            Directory.CreateDirectory(destDirName);

            // Get the files in the directory and copy them to the new location.
            FileInfo[] files = dir.GetFiles();
            foreach (FileInfo file in files)
            {
                string tempPath = Path.Combine(destDirName, file.Name);
                file.CopyTo(tempPath, false);
            }

            // If copying subdirectories, copy them and their contents to new location.
            if (copySubDirs)
            {
                foreach (DirectoryInfo subdir in dirs)
                {
                    string tempPath = Path.Combine(destDirName, subdir.Name);
                    DirectoryCopy(subdir.FullName, tempPath, copySubDirs);
                }
            }
        }


        public JsonResult getFolder(string p)
        {
            try
            {
                FolderData folderData = new FolderData();  // FolderData has the relative path and arrays of folders and files.

                if (String.IsNullOrEmpty(p)) p = "";
                folderData.relativePath = p;

                string root = Server.MapPath(ConfigurationManager.AppSettings["rootFolder"]);
                // warning: When using "Combine," if relativePath is \ or another "absolute" path, only it is returned! 
                string fullpath = Path.Combine(root, p);
                DirectoryInfo di = new DirectoryInfo(fullpath);

                var folders = di.GetDirectories();
                if (folders.Count() > 0)
                    folderData.folders = folders.Select(x => x.Name).ToArray();
                else
                    folderData.folders = new List<string>().ToArray();

                var files = di.GetFiles();
                if (files.Count() > 0)
                    folderData.files = files.Select(x => x.Name).ToArray();
                else folderData.files = new List<string>().ToArray(); // TODO: ???

                //return new JsonResult(Newtonsoft.Json.JsonConvert.SerializeObject(folderData));
                return Json(folderData, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                throw new Exception("Could not find path." + ex.Message);
            }
        }

        private bool DirectoryIsEmpty(string path)
        {
            if (Directory.GetDirectories(path).Count() > 0) return false; 
            if (Directory.GetFiles(path).Count() > 0) return false;

            return true;
        }


        [HttpPost]
        public ActionResult DeleteFileOrDirectory(string filepath, bool bForced)
        {
            try
            {
                string root = ConfigurationManager.AppSettings["rootFolder"];

                string fromdir = Server.MapPath(Path.Combine(root, filepath));

                if (Directory.Exists(fromdir))
                {
                    // It's a folder, so delete it if it's not empty
                    if (DirectoryIsEmpty(fromdir) || bForced)
                    {
                        Directory.Delete(fromdir, bForced);
                        if (bForced)
                        {
                            return Json($"Non-empty folder deleted: {filepath}");
                        }
                        else
                        {
                            return Json($"Folder deleted: {filepath}");
                        }
                    }
                    else throw new Exception("Folder is not empty.");
                }
                else
                {
                    string newfilepath = Server.MapPath(Path.Combine(root, filepath));
                    FileInfo fi = new FileInfo(newfilepath);
                    fi.Delete();
                    return Json($"File deleted: {filepath}");
                }
            }
            catch (Exception ex)
            {
                return Json("Error occurred. Error details: " + ex.Message);
            }
        }

        [HttpPost]
        public ActionResult MoveFileOrDirectory(string frompath, string topath)
        {
            try
            {
                string root = ConfigurationManager.AppSettings["rootFolder"];

                string fromdir = Server.MapPath(Path.Combine(root,frompath));
                string todir = Server.MapPath(Path.Combine(root, topath));

                if (Directory.Exists(fromdir) && Directory.Exists(todir))
                {
                    return MoveFolder(frompath, topath);
                    // we're moving directories!
                    // return Json($"File moved from {frompath} to {topath}");
                }
                else
                {
                    // add filename to the to path 
                    string filename = Path.GetFileName(frompath);
                    topath = Path.Combine(topath, filename);

                    string fullfrompath = Server.MapPath(Path.Combine(root, frompath));
                    string fulltopath = Server.MapPath(Path.Combine(root, topath));

                    System.IO.File.Move(fullfrompath, fulltopath);

                    return Json($"File moved from {frompath} to {topath}");
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error: " + ex.Message);
            }

        }
        public ActionResult CopyFileOrDirectory(string frompath, string topath)
        {
            try
            {
                string root = ConfigurationManager.AppSettings["rootFolder"];
                
                string fromdir = Server.MapPath(Path.Combine(root, frompath));
                string todir = Server.MapPath(Path.Combine(root, topath));

                if (Directory.Exists(fromdir) && Directory.Exists(todir))
                {
                    return CopyFolder(frompath, topath);
                }
                else
                {
                    // add filename to the topath 
                    string filename = Path.GetFileName(frompath);
                    topath = Path.Combine(topath, filename);

                    string fullfrompath = Server.MapPath(Path.Combine(root, frompath));
                    string fulltopath = Server.MapPath(Path.Combine(root, topath));

                    System.IO.File.Copy(fullfrompath, fulltopath);

                    return Json($"File copied from {frompath} to {topath}");
                }
            }
            catch (Exception ex)
            {
                //throw new Exception("Error: " + ex.Message);
                return Json($"File could not be copied. Error: " + ex.Message);
            }
        }

        [HttpPost]
        public string GetFile(string filepath)
        {
            string rootPath = ConfigurationManager.AppSettings["rootFolder"];
            string fullpath = Path.Combine(rootPath, filepath);
            string data = "";
            try
            {
                data = System.IO.File.ReadAllText(Server.MapPath(fullpath));
            }
            catch (Exception ex)
            {
                throw;
            }


            return data;
        }





        [HttpPost]
        public ActionResult UploadFiles()
        {
            // Checking no of files injected in Request object  
            if (Request.Files.Count > 0)
            {
                try
                {
                    //  Get all files from Request object  
                    HttpFileCollectionBase files = Request.Files;
                    for (int i = 0; i < files.Count; i++)
                    {
                        //string path = AppDomain.CurrentDomain.BaseDirectory + "Uploads/";  
                        //string filename = Path.GetFileName(Request.Files[i].FileName);  

                        HttpPostedFileBase file = files[i];
                        string fname;

                        // Checking for Internet Explorer  
                        //if (Request.Browser.Browser.ToUpper() == "IE" || Request.Browser.Browser.ToUpper() == "INTERNETEXPLORER")
                        // {
                        //     string[] testfiles = file.FileName.Split(new char[] { '\\' });
                        //     fname = testfiles[testfiles.Length - 1];
                        // }
                        //else
                        // {
                        fname = file.FileName;
                        //}
                        //string destinationFolder = "~/Uploads/";
                        string destinationFolder = Request.Params["destinationFolder"];
                        string folder = Path.Combine(ConfigurationManager.AppSettings["rootFolder"], destinationFolder);
                        // Get the complete folder path and store the file inside it.  
                        fname = Path.Combine(Server.MapPath(folder), fname);
                        file.SaveAs(fname);
                    }
                    // Returns message that successfully uploaded  
                    return Json("File Uploaded Successfully!");
                }
                catch (Exception ex)
                {
                    return Json("Error occurred. Error details: " + ex.Message);
                }
            }
            else
            {
                return Json("No files selected.");
            }
        }

    }
}