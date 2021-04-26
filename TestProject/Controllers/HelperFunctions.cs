using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;

namespace TestProject.Controllers
{
    public class HelperFunctions
    {
        public static string getRoot()
        {
            return ConfigurationManager.AppSettings["rootFolder"];
        }

        // MakeResponse
        // Makes standard success/msg response used for many functions. 
        //
        public static Dictionary<string, string> MakeResponse(string success, string msg)
        {
            Dictionary<string, string> dict = new Dictionary<string, string>();

            dict.Add("success", success);
            dict.Add("msg", msg);

            return dict;

        }

        //// RemoveRootFolder
        //// Removes the server-mapped root folder prefix from the path.
        ////
        //public static string RemoveRootFolder(string path)
        //{
        //    string rootFolder = Server.MapPath(getRoot());

        //    string shortName = path.Replace(rootFolder, "");

        //    return shortName;
        //}
    }
}