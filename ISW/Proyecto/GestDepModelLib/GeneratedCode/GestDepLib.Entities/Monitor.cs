﻿//------------------------------------------------------------------------------
// <auto-generated>
//     Este código se generó mediante una herramienta.
//     Los cambios del archivo se perderán si se regenera el código.
// </auto-generated>
//------------------------------------------------------------------------------
namespace GestDepLib.Entities
{
	using System;
	using System.Collections.Generic;
	using System.Linq;
	using System.Text;

	public partial class Monitor : Person
	{
		public string Ssn
		{
			get;
			set;
		}

		public virtual ICollection<Course> Courses
		{
			get;
			set;
		}

	}
}

