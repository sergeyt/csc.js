using System;

class Test {
  static void Main(){
  	var mod1 = new Module1();
  	Console.WriteLine(mod1.GetName());

  	var mod4 = new Module4();
	Console.WriteLine(mod4.GetName());

	var mod5 = new Module5();
	Console.WriteLine(mod5.GetName());
  }
}