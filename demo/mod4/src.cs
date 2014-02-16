using System;

public class Module4 {
	public string GetName(){
		var mod2 = new Module2();
		Console.WriteLine(mod2.GetName());
		var mod3 = new Module3();
		Console.WriteLine(mod3.GetName());
		return "Module4";
	}
}