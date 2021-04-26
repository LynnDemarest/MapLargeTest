namespace TestProject.Controllers
{
    class JsonResponse
    {
        public bool success { get; set; }
        public string msg { get; set; }
        public object data { get; set; }

        public JsonResponse(bool success, string msg, object data)
        {
            this.success = success;
            this.msg = msg;
            this.data = data;
        }
    }
}