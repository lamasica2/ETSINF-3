﻿//------------------------------------------------------------------------------
// <auto-generated>
//     Este código se generó mediante una herramienta.
//     Los cambios del archivo se perderán si se regenera el código.
// </auto-generated>
//------------------------------------------------------------------------------
namespace ISWVehicleRentalExampleLib.Entities
{
	using System;
	using System.Collections.Generic;
	using System.Linq;
	using System.Text;

	public partial class Customer : Person
	{
		public DateTime registrationDate
		{
			get;
			set;
		}

		public virtual CreditCard Card
		{
			get;
			set;
		}

	}
}

