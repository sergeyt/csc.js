using System;

public class Module3 {
	public string GetName(){
		var mod1 = new Module1();
		Console.WriteLine(mod1.GetName());
		var mod2 = new Module2();
		Console.WriteLine(mod2.GetName());
		return "Module3";
	}
}