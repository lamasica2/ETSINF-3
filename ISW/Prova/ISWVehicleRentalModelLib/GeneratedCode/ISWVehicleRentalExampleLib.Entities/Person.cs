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

	public partial class Person
	{
		public string dni
		{
			get;
			set;
		}

		public string name
		{
			get;
			set;
		}

		public string address
		{
			get;
			set;
		}

		public string city
		{
			get;
			set;
		}

		public string postalCode
		{
			get;
			set;
		}

		public DateTime dateDriverLicense
		{
			get;
			set;
		}

		public virtual ICollection<Reservation> DrivenReservations
		{
			get;
			set;
		}

	}
}
