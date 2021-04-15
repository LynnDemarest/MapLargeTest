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
            catch(Exception ex)
            {
                throw new Exception("Could not find path. Error was: " + ex.Message);
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


        [HttpPost]
        public ActionResult DeleteFile(string filepath)
        {
            try
            {
                string root = ConfigurationManager.AppSettings["rootFolder"];
                string newfilepath = Server.MapPath(Path.Combine(root, filepath));
                FileInfo fi = new FileInfo(newfilepath);
                fi.Delete();
                return Json($"File deleted: {filepath}");
            }
            catch (Exception ex)
            {
                return Json("Error occurred. Error details: " + ex.Message);
            }
        }

        [HttpPost]
        public string GetFile(string filepath, string filename)
        {
            string rootPath = ConfigurationManager.AppSettings["rootFolder"];
            string fullpath = Path.Combine(rootPath, filepath, filename);

            string data = System.IO.File.ReadAllText(Server.MapPath(fullpath));

            //data = HttpUtility.HtmlEncode(data);

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