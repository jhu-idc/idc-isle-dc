package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/stretchr/testify/assert"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"testing"
)

const (
	// The name of the directory under 'tests/' that contains all the resources (test source code, migration csv, expected test results).
	// If this directory is renamed or moved, this constant must be updated.  See also `findExpectedJson(...)` and its
	// assumptions of the directory structure that are underneath the TestBaseDir.
	// TODO: consult env?
	TestBasedir = "10-migration-backend-tests"

	// The base URL of the test instance of IDC.
	// TODO: consult env
	DrupalBaseurl = "https://islandora-idc.traefik.me"
)

// Verifies that the Person migrated by testcafe persons-01.csv and persons-02.csv 
// match the expected fields and values present in taxonomy-person-01.json
func Test_VerifyTaxonomyTermPerson_Person1(t *testing.T) {
    verifyTaxonomyTermPerson(t, "taxonomy-person-01.json", "Ansel Easton");
}

// Verifies that the Person migrated by testcafe persons-01.csv and persons-02.csv 
// match the expected fields and values present in taxonomy-person-01.json
func Test_VerifyTaxonomyTermPerson_Person2(t *testing.T) {
    verifyTaxonomyTermPerson(t, "taxonomy-person-02.json", "Lewis Wickes");
}

func verifyTaxonomyTermPerson(t *testing.T, fileName string, restOfName string) {
	expectedJson := ExpectedPerson{}
    log.Printf("Test Person file: %s and %s", fileName, restOfName)
    unmarshalJson(t, fileName, &expectedJson)

    // sanity check the expected json
    assert.Equal(t, "taxonomy_term", expectedJson.Type)
    assert.Equal(t, "person", expectedJson.Bundle)
    assert.Equal(t, restOfName, expectedJson.RestOfName[0])
    u := &JsonApiUrl{
        t:            t,
        baseUrl:      DrupalBaseurl,
        drupalEntity: expectedJson.Type,
        drupalBundle: expectedJson.Bundle,
        filter:       "name",
        value:        expectedJson.Name,
    }

    // retrieve json of the migrated entity from the jsonapi and unmarshal the single response
    personRes := &JsonApiPerson{}
    u.get(personRes)

    // for each field in expected json,
    //   see if the expected field matches the actual field from retrieved json
    //   resolve relationships if required
    //     - required for schema:knows
    actual := personRes.JsonApiData[0]
    assert.Equal(t, expectedJson.Type, actual.Type.entity())
    assert.Equal(t, expectedJson.Bundle, actual.Type.bundle())
    assert.Equal(t, expectedJson.PrimaryName, actual.JsonApiAttributes.PrimaryPartOfName)
    assert.ElementsMatch(t, expectedJson.RestOfName, actual.JsonApiAttributes.PreferredNameRest)
    assert.ElementsMatch(t, expectedJson.Prefix, actual.JsonApiAttributes.PreferredNamePrefix)
    assert.ElementsMatch(t, expectedJson.Suffix, actual.JsonApiAttributes.PreferredNameSuffix)
    assert.ElementsMatch(t, expectedJson.Number, actual.JsonApiAttributes.PreferredNameNumber)
    assert.ElementsMatch(t, expectedJson.AltName, actual.JsonApiAttributes.PersonAlternateName)
    assert.ElementsMatch(t, expectedJson.Date, actual.JsonApiAttributes.Dates)
    assert.Equal(t, expectedJson.Authority[0].Uri, actual.JsonApiAttributes.Authority[0].Uri)
    assert.Equal(t, expectedJson.Authority[0].Type, actual.JsonApiAttributes.Authority[0].Source)
    assert.True(t, len(actual.JsonApiAttributes.Description.Processed) > 0)
    assert.Equal(t, expectedJson.Description.Processed, actual.JsonApiAttributes.Description.Processed)
    assert.True(t, len(actual.JsonApiAttributes.Description.Value) > 0)
    assert.Equal(t, expectedJson.Description.Value, actual.JsonApiAttributes.Description.Value)
    assert.Equal(t, expectedJson.Description.Format, actual.JsonApiAttributes.Description.Format)

    // Resolve relationship to a name
    assert.Equal(t, 1, len(actual.JsonApiRelationships.Relationships.Data))
    relData := actual.JsonApiRelationships.Relationships.Data[0]
    assert.Equal(t, "schema:knows", relData.Meta["rel_type"])
    u.value = expectedJson.Knows[0]

    // retrieve json of the resolved entity from the jsonapi
    personRes = &JsonApiPerson{}
    u.get(personRes)
    relSchemaKnows := personRes.JsonApiData[0]

    // sanity
    assert.Equal(t, relSchemaKnows.Type.bundle(), "person")
    assert.Equal(t, relSchemaKnows.Type.entity(), "taxonomy_term")

    // test
    assert.Equal(t, expectedJson.Knows[0], relSchemaKnows.JsonApiAttributes.Name)
}

func Test_VerifyTaxonomyTermAccessRights(t *testing.T) {
	expectedJson := ExpectedAccessRights{}
	unmarshalJson(t, "taxonomy-accessrights.json", &expectedJson)

	// sanity check the expected json
	assert.Equal(t, "taxonomy_term", expectedJson.Type)
	assert.Equal(t, "access_rights", expectedJson.Bundle)

	u := &JsonApiUrl{
		t:            t,
		baseUrl:      DrupalBaseurl,
		drupalEntity: expectedJson.Type,
		drupalBundle: expectedJson.Bundle,
		filter:       "name",
		value:        expectedJson.Name,
	}

	// retrieve json of the migrated entity from the jsonapi and unmarshal the single response
	accessRightsRes := &JsonApiAccessRights{}
	u.get(accessRightsRes)

	actual := accessRightsRes.JsonApiData[0]
	assert.Equal(t, expectedJson.Type, actual.Type.entity())
	assert.Equal(t, expectedJson.Bundle, actual.Type.bundle())
	assert.Equal(t, expectedJson.Name, actual.JsonApiAttributes.Name)
	assert.Equal(t, expectedJson.Description.Format, actual.JsonApiAttributes.Description.Format)
	assert.Equal(t, expectedJson.Description.Value, actual.JsonApiAttributes.Description.Value)
	assert.Equal(t, expectedJson.Description.Processed, actual.JsonApiAttributes.Description.Processed)
	assert.Equal(t, len(expectedJson.Authority), len(actual.JsonApiAttributes.Authority))
	assert.Equal(t, 2, len(actual.JsonApiAttributes.Authority))
	for i, v := range actual.JsonApiAttributes.Authority {
		assert.Equal(t, expectedJson.Authority[i].Source, v.Source)
		assert.Equal(t, expectedJson.Authority[i].Uri, v.Uri)
	}
}

func Test_VerifyTaxonomyCopyrightAndUse(t *testing.T) {
	expectedJson := ExpectedCopyrightAndUse{}
	unmarshalJson(t, "taxonomy-copyrightanduse.json", &expectedJson)

	// sanity check the expected json
	assert.Equal(t, "taxonomy_term", expectedJson.Type)
	assert.Equal(t, "copyright_and_use", expectedJson.Bundle)

	u := &JsonApiUrl{
		t:            t,
		baseUrl:      DrupalBaseurl,
		drupalEntity: expectedJson.Type,
		drupalBundle: expectedJson.Bundle,
		filter:       "name",
		value:        expectedJson.Name,
	}

	// retrieve json of the migrated entity from the jsonapi and unmarshal the single response
	copyrightRes := &JsonApiCopyrightAndUse{}
	u.get(copyrightRes)

	actual := copyrightRes.JsonApiData[0]
	assert.Equal(t, expectedJson.Type, actual.Type.entity())
	assert.Equal(t, expectedJson.Bundle, actual.Type.bundle())
	assert.Equal(t, expectedJson.Name, actual.JsonApiAttributes.Name)
	assert.Equal(t, expectedJson.Description.Format, actual.JsonApiAttributes.Description.Format)
	assert.Equal(t, expectedJson.Description.Value, actual.JsonApiAttributes.Description.Value)
	assert.Equal(t, expectedJson.Description.Processed, actual.JsonApiAttributes.Description.Processed)
	assert.Equal(t, len(expectedJson.Authority), len(actual.JsonApiAttributes.Authority))
	assert.Equal(t, 2, len(actual.JsonApiAttributes.Authority))
	for i, v := range actual.JsonApiAttributes.Authority {
		assert.Equal(t, expectedJson.Authority[i].Source, v.Source)
		assert.Equal(t, expectedJson.Authority[i].Uri, v.Uri)
	}
}

func Test_VerifyTaxonomyTermFamily(t *testing.T) {
	expectedJson := ExpectedFamily{}
	unmarshalJson(t, "taxonomy-family-01.json", &expectedJson)

	// sanity check the expected json
	assert.Equal(t, "taxonomy_term", expectedJson.Type)
	assert.Equal(t, "family", expectedJson.Bundle)

	u := &JsonApiUrl{
		t:            t,
		baseUrl:      DrupalBaseurl,
		drupalEntity: expectedJson.Type,
		drupalBundle: expectedJson.Bundle,
		filter:       "name",
		value:        expectedJson.Name,
	}

	// retrieve json of the migrated entity from the jsonapi and unmarshal the single response
	familyres := &JsonApiFamily{}
	u.get(familyres)
	sourceId := familyres.JsonApiData[0].Id
	assert.NotEmpty(t, sourceId)

	actual := familyres.JsonApiData[0]
	assert.Equal(t, expectedJson.Type, actual.Type.entity())
	assert.Equal(t, expectedJson.Bundle, actual.Type.bundle())
	assert.Equal(t, expectedJson.Name, actual.JsonApiAttributes.Name)
	assert.Equal(t, expectedJson.Description.Format, actual.JsonApiAttributes.Description.Format)
	assert.Equal(t, expectedJson.Description.Value, actual.JsonApiAttributes.Description.Value)
	assert.Equal(t, expectedJson.Description.Processed, actual.JsonApiAttributes.Description.Processed)
	assert.Equal(t, len(expectedJson.Authority), len(actual.JsonApiAttributes.Authority))
	assert.Equal(t, 2, len(actual.JsonApiAttributes.Authority))
	for i, v := range actual.JsonApiAttributes.Authority {
		assert.Equal(t, expectedJson.Authority[i].Source, v.Source)
		assert.Equal(t, expectedJson.Authority[i].Uri, v.Uri)
	}
	assert.Equal(t, expectedJson.Title, actual.JsonApiAttributes.Title)
	assert.Equal(t, expectedJson.FamilyName, actual.JsonApiAttributes.FamilyName)
	assert.Equal(t, 2, len(actual.JsonApiAttributes.Date))
	assert.Equal(t, 2, len(expectedJson.Date))
	for i, v := range actual.JsonApiAttributes.Date {
		assert.Equal(t, expectedJson.Date[i], v)
	}

	// Resolve relationship to a name
	relData := familyres.JsonApiData[0].JsonApiRelationships.Relationships.Data[0]
	assert.Equal(t, "schema:knowsAbout", relData.Meta["rel_type"])
	u.value = expectedJson.KnowsAbout[0]

	// retrieve json of the resolved entity from the jsonapi
	familyres = &JsonApiFamily{}
	u.get(familyres)
	relSchemaKnowsAbout := familyres.JsonApiData[0]

	// sanity
	assert.Equal(t, relSchemaKnowsAbout.Type.bundle(), "family")
	assert.Equal(t, relSchemaKnowsAbout.Type.entity(), "taxonomy_term")

	// test
	assert.Equal(t, expectedJson.KnowsAbout[0], relSchemaKnowsAbout.JsonApiAttributes.Name)

	// assert the reciprocal relationship holds (e.g. the id referenced by the target is the same as the source id)
	assert.Equal(t, sourceId, relSchemaKnowsAbout.JsonApiRelationships.Relationships.Data[0].Id)
}

func Test_VerifyTaxonomyTermGenre(t *testing.T) {
	expectedJson := ExpectedGenre{}
	unmarshalJson(t, "taxonomy-genre.json", &expectedJson)

	// sanity check the expected json
	assert.Equal(t, "taxonomy_term", expectedJson.Type)
	assert.Equal(t, "genre", expectedJson.Bundle)

	u := &JsonApiUrl{
		t:            t,
		baseUrl:      DrupalBaseurl,
		drupalEntity: expectedJson.Type,
		drupalBundle: expectedJson.Bundle,
		filter:       "name",
		value:        expectedJson.Name,
	}

	// retrieve json of the migrated entity from the jsonapi and unmarshal the single response
	genreRes := &JsonApiGenre{}
	u.get(genreRes)

	actual := genreRes.JsonApiData[0]
	assert.Equal(t, expectedJson.Type, actual.Type.entity())
	assert.Equal(t, expectedJson.Bundle, actual.Type.bundle())
	assert.Equal(t, expectedJson.Name, actual.JsonApiAttributes.Name)
	assert.Equal(t, expectedJson.Description.Format, actual.JsonApiAttributes.Description.Format)
	assert.Equal(t, expectedJson.Description.Value, actual.JsonApiAttributes.Description.Value)
	assert.Equal(t, expectedJson.Description.Processed, actual.JsonApiAttributes.Description.Processed)
	assert.Equal(t, len(expectedJson.Authority), len(actual.JsonApiAttributes.Authority))
	assert.Equal(t, 2, len(actual.JsonApiAttributes.Authority))
	for i, v := range actual.JsonApiAttributes.Authority {
		assert.Equal(t, expectedJson.Authority[i].Source, v.Source)
		assert.Equal(t, expectedJson.Authority[i].Uri, v.Uri)
	}
}

func Test_VerifyTaxonomyTermGeolocation(t *testing.T) {
	expectedJson := ExpectedGeolocation{}
	unmarshalJson(t, "taxonomy-geolocation.json", &expectedJson)

	// sanity check the expected json
	assert.Equal(t, "taxonomy_term", expectedJson.Type)
	assert.Equal(t, "geo_location", expectedJson.Bundle)

	u := &JsonApiUrl{
		t:            t,
		baseUrl:      DrupalBaseurl,
		drupalEntity: expectedJson.Type,
		drupalBundle: expectedJson.Bundle,
		filter:       "name",
		value:        expectedJson.Name,
	}

	// retrieve json of the migrated entity from the jsonapi and unmarshal the single response
	res := &JsonApiGeolocation{}
	u.get(res)

	actual := res.JsonApiData[0]
	assert.Equal(t, expectedJson.Type, actual.Type.entity())
	assert.Equal(t, expectedJson.Bundle, actual.Type.bundle())
	assert.Equal(t, expectedJson.Name, actual.JsonApiAttributes.Name)
	assert.Equal(t, expectedJson.Description.Format, actual.JsonApiAttributes.Description.Format)
	assert.Equal(t, expectedJson.Description.Value, actual.JsonApiAttributes.Description.Value)
	assert.Equal(t, expectedJson.Description.Processed, actual.JsonApiAttributes.Description.Processed)
	assert.Equal(t, len(expectedJson.Authority), len(actual.JsonApiAttributes.Authority))
	assert.Equal(t, 2, len(actual.JsonApiAttributes.Authority))
	for i, v := range actual.JsonApiAttributes.Authority {
		assert.Equal(t, expectedJson.Authority[i].Source, v.Source)
		assert.Equal(t, expectedJson.Authority[i].Uri, v.Uri)
	}
	assert.Equal(t, 2, len(actual.JsonApiAttributes.GeoAltName))
	for i, v := range actual.JsonApiAttributes.GeoAltName {
		assert.Equal(t, expectedJson.GeoAltName[i], v)
	}
	assert.Equal(t, 0, len(actual.JsonApiAttributes.Broader))
	for i, v := range actual.JsonApiAttributes.Broader {
		assert.Equal(t, expectedJson.Broader[i].Title, v.Title)
		assert.Equal(t, expectedJson.Broader[i].Uri, v.Uri)
	}
}

func Test_VerifyTaxonomyTermResourceType(t *testing.T) {
	expectedJson := ExpectedAccessRights{}
	unmarshalJson(t, "taxonomy-resourcetypes.json", &expectedJson)

	// sanity check the expected json
	assert.Equal(t, "taxonomy_term", expectedJson.Type)
	assert.Equal(t, "resource_types", expectedJson.Bundle)

	u := &JsonApiUrl{
		t:            t,
		baseUrl:      DrupalBaseurl,
		drupalEntity: expectedJson.Type,
		drupalBundle: expectedJson.Bundle,
		filter:       "name",
		value:        expectedJson.Name,
	}

	// retrieve json of the migrated entity from the jsonapi and unmarshal the single response
	res := &JsonApiResourceType{}
	u.get(res)

	actual := res.JsonApiData[0]
	assert.Equal(t, expectedJson.Type, actual.Type.entity())
	assert.Equal(t, expectedJson.Bundle, actual.Type.bundle())
	assert.Equal(t, expectedJson.Name, actual.JsonApiAttributes.Name)
	assert.Equal(t, expectedJson.Description.Format, actual.JsonApiAttributes.Description.Format)
	assert.Equal(t, expectedJson.Description.Value, actual.JsonApiAttributes.Description.Value)
	assert.Equal(t, expectedJson.Description.Processed, actual.JsonApiAttributes.Description.Processed)
	assert.Equal(t, len(expectedJson.Authority), len(actual.JsonApiAttributes.Authority))
	assert.Equal(t, 2, len(actual.JsonApiAttributes.Authority))
	for i, v := range actual.JsonApiAttributes.Authority {
		assert.Equal(t, expectedJson.Authority[i].Source, v.Source)
		assert.Equal(t, expectedJson.Authority[i].Uri, v.Uri)
	}
}

func Test_VerifyTaxonomySubject(t *testing.T) {
	expectedJson := ExpectedSubject{}
	unmarshalJson(t, "taxonomy-subject.json", &expectedJson)

	// sanity check the expected json
	assert.Equal(t, "taxonomy_term", expectedJson.Type)
	assert.Equal(t, "subject", expectedJson.Bundle)

	u := &JsonApiUrl{
		t:            t,
		baseUrl:      DrupalBaseurl,
		drupalEntity: expectedJson.Type,
		drupalBundle: expectedJson.Bundle,
		filter:       "name",
		value:        expectedJson.Name,
	}

	// retrieve json of the migrated entity from the jsonapi and unmarshal the single response
	res := &JsonApiSubject{}
	u.get(res)

	actual := res.JsonApiData[0]
	assert.Equal(t, expectedJson.Type, actual.Type.entity())
	assert.Equal(t, expectedJson.Bundle, actual.Type.bundle())
	assert.Equal(t, expectedJson.Name, actual.JsonApiAttributes.Name)
	assert.Equal(t, expectedJson.Description.Format, actual.JsonApiAttributes.Description.Format)
	assert.Equal(t, expectedJson.Description.Value, actual.JsonApiAttributes.Description.Value)
	assert.Equal(t, expectedJson.Description.Processed, actual.JsonApiAttributes.Description.Processed)
	assert.Equal(t, len(expectedJson.Authority), len(actual.JsonApiAttributes.Authority))
	assert.Equal(t, 2, len(actual.JsonApiAttributes.Authority))
	for i, v := range actual.JsonApiAttributes.Authority {
		assert.Equal(t, expectedJson.Authority[i].Source, v.Source)
		assert.Equal(t, expectedJson.Authority[i].Uri, v.Uri)
	}
}

func Test_VerifyTaxonomyTermLanguage(t *testing.T) {
	expectedJson := ExpectedLanguage{}
	unmarshalJson(t, "taxonomy-language.json", &expectedJson)

	// sanity check the expected json
	assert.Equal(t, "taxonomy_term", expectedJson.Type)
	assert.Equal(t, "language", expectedJson.Bundle)

	u := &JsonApiUrl{
		t:            t,
		baseUrl:      DrupalBaseurl,
		drupalEntity: expectedJson.Type,
		drupalBundle: expectedJson.Bundle,
		filter:       "name",
		value:        expectedJson.Name,
	}

	// retrieve json of the migrated entity from the jsonapi and unmarshal the single response
	res := &JsonApiLanguage{}
	u.get(res)

	actual := res.JsonApiData[0]
	assert.Equal(t, expectedJson.Type, actual.Type.entity())
	assert.Equal(t, expectedJson.Bundle, actual.Type.bundle())
	assert.Equal(t, expectedJson.Name, actual.JsonApiAttributes.Name)
	assert.Equal(t, expectedJson.Description.Format, actual.JsonApiAttributes.Description.Format)
	assert.Equal(t, expectedJson.Description.Value, actual.JsonApiAttributes.Description.Value)
	assert.Equal(t, expectedJson.Description.Processed, actual.JsonApiAttributes.Description.Processed)
	assert.Equal(t, len(expectedJson.Authority), len(actual.JsonApiAttributes.Authority))
	assert.Equal(t, 2, len(actual.JsonApiAttributes.Authority))
	for i, v := range actual.JsonApiAttributes.Authority {
		assert.Equal(t, expectedJson.Authority[i].Source, v.Source)
		assert.Equal(t, expectedJson.Authority[i].Uri, v.Uri)
	}
	assert.Equal(t, expectedJson.LanguageCode, actual.JsonApiAttributes.LanguageCode)
}

func Test_VerifyTaxonomyTermCorporateBody(t *testing.T) {
	expectedJson := ExpectedCorporateBody{}
	unmarshalJson(t, "taxonomy-corporatebody-02.json", &expectedJson)

	// sanity check the expected json
	assert.Equal(t, "taxonomy_term", expectedJson.Type)
	assert.Equal(t, "corporate_body", expectedJson.Bundle)

	u := &JsonApiUrl{
		t:            t,
		baseUrl:      DrupalBaseurl,
		drupalEntity: expectedJson.Type,
		drupalBundle: expectedJson.Bundle,
		filter:       "name",
		value:        expectedJson.Name,
	}

	// retrieve json of the migrated entity from the jsonapi and unmarshal the single response
	res := &JsonApiCorporateBody{}
	u.get(res)

	actual := res.JsonApiData[0]
	assert.Equal(t, expectedJson.Type, actual.Type.entity())
	assert.Equal(t, expectedJson.Bundle, actual.Type.bundle())
	assert.Equal(t, expectedJson.Name, actual.JsonApiAttributes.Name)
	assert.Equal(t, expectedJson.Description.Format, actual.JsonApiAttributes.Description.Format)
	assert.Equal(t, expectedJson.Description.Value, actual.JsonApiAttributes.Description.Value)
	assert.Equal(t, expectedJson.Description.Processed, actual.JsonApiAttributes.Description.Processed)
	assert.Equal(t, len(expectedJson.Authority), len(actual.JsonApiAttributes.Authority))
	assert.Equal(t, 2, len(actual.JsonApiAttributes.Authority))
	for i, v := range actual.JsonApiAttributes.Authority {
		assert.Equal(t, expectedJson.Authority[i].Source, v.Source)
		assert.Equal(t, expectedJson.Authority[i].Uri, v.Uri)
	}
	assert.Equal(t, expectedJson.PrimaryName, actual.JsonApiAttributes.PrimaryName)
	assert.ElementsMatch(t, expectedJson.DateOfMeeting, actual.JsonApiAttributes.DateOfMeeting)
	assert.ElementsMatch(t, expectedJson.Location, actual.JsonApiAttributes.Location)
	assert.ElementsMatch(t, expectedJson.NumberOrSection, actual.JsonApiAttributes.NumberOrSection)
	assert.ElementsMatch(t, expectedJson.SubordinateName, actual.JsonApiAttributes.SubordinateName)
	assert.ElementsMatch(t, expectedJson.AltName, actual.JsonApiAttributes.AltName)
	assert.ElementsMatch(t, expectedJson.Date, actual.JsonApiAttributes.Date)

	// resolve and verify relationships

	// "My Corporate Body" -> 'schema:parentOrganization' -> "Parent Organization"
	relData := actual.JsonApiRelationships.Relationships.Data
	assert.Equal(t, 1, len(relData))
	assert.Equal(t, len(expectedJson.Relationship), len(relData))
	assert.Equal(t, "taxonomy_term", relData[0].Type.entity())
	assert.Equal(t, "corporate_body", relData[0].Type.bundle())
	assert.Equal(t, expectedJson.Relationship[0].Rel, relData[0].Meta["rel_type"])
	u = &JsonApiUrl{
		t:            t,
		baseUrl:      DrupalBaseurl,
		drupalEntity: relData[0].Type.entity(),
		drupalBundle: relData[0].Type.bundle(),
		filter:       "id",
		value:        relData[0].Id,
	}
	target := &JsonApiCorporateBody{}
	u.get(target)
	assert.Equal(t, expectedJson.Relationship[0].Name, target.JsonApiData[0].JsonApiAttributes.Name)

	//  "Parent Organization" -> 'schema:subOrganization' -> "My Corporate Body"
	assert.Equal(t, target.JsonApiData[0].JsonApiRelationships.Relationships.Data[0].Id, actual.Id)
	assert.Equal(t, target.JsonApiData[0].JsonApiRelationships.Relationships.Data[0].Meta["rel_type"], "schema:subOrganization")
}

func Test_VerifyCollection(t *testing.T) {
	expectedJson := ExpectedCollection{}
	unmarshalJson(t, "collection-01.json", &expectedJson)

	// sanity check the expected json
	assert.Equal(t, "node", expectedJson.Type)
	assert.Equal(t, "collection_object", expectedJson.Bundle)

	u := &JsonApiUrl{
		t:            t,
		baseUrl:      DrupalBaseurl,
		drupalEntity: expectedJson.Type,
		drupalBundle: expectedJson.Bundle,
		filter:       "title",
		value:        expectedJson.Title,
	}

	// retrieve json of the migrated entity from the jsonapi and unmarshal the single response
	res := &JsonApiCollection{}
	u.get(res)
	sourceId := res.JsonApiData[0].Id
	assert.NotEmpty(t, sourceId)

	actual := res.JsonApiData[0]
	assert.Equal(t, expectedJson.Type, actual.Type.entity())
	assert.Equal(t, expectedJson.Bundle, actual.Type.bundle())
	assert.Equal(t, expectedJson.Title, actual.JsonApiAttributes.Title)
	assert.Equal(t, expectedJson.ContactEmail, actual.JsonApiAttributes.ContactEmail)
	assert.Equal(t, expectedJson.ContactName, actual.JsonApiAttributes.ContactName)
	assert.ElementsMatch(t, expectedJson.CollectionNumber, actual.JsonApiAttributes.CollectionNumber)

	relData := res.JsonApiData[0].JsonApiRelationships

	// Resolve and verify title language
	assert.NotNil(t, relData.TitleLanguage.Data)
	assert.Equal(t, "taxonomy_term", relData.TitleLanguage.Data.Type.entity())
	assert.Equal(t, "language", relData.TitleLanguage.Data.Type.bundle())
	assert.Equal(t, expectedJson.TitleLangCode, relData.TitleLanguage.Data.langCode(t))

	// Resolve and verify alternate title values and languages
	assert.NotNil(t, relData.AltTitle.Data)
	assert.Equal(t, 2, len(relData.AltTitle.Data))
	assert.Equal(t, len(expectedJson.AltTitle), len(relData.AltTitle.Data))
	for i, altTitleData := range relData.AltTitle.Data {
		assert.Equal(t, "taxonomy_term", altTitleData.Type.entity())
		assert.Equal(t, "language", altTitleData.Type.bundle())
		assert.Equal(t, expectedJson.AltTitle[i].Value, altTitleData.value())
		assert.Equal(t, expectedJson.AltTitle[i].LangCode, altTitleData.langCode(t))
	}

	// Resolve and verify description values and languages
	assert.NotNil(t, relData.Description)
	assert.Equal(t, 2, len(relData.Description.Data))
	assert.Equal(t, len(expectedJson.Description), len(relData.Description.Data))
	for i, descData := range relData.Description.Data {
		assert.Equal(t, "taxonomy_term", descData.Type.entity())
		assert.Equal(t, "language", descData.Type.bundle())
		assert.Equal(t, expectedJson.Description[i].Value, descData.value())
		assert.Equal(t, expectedJson.Description[i].LangCode, descData.langCode(t))
	}

	// Resolve and verify member_of values
	assert.NotNil(t, relData.MemberOf)
	assert.Equal(t, 1, len(relData.MemberOf.Data))
	assert.Equal(t, len(expectedJson.MemberOf), len(relData.MemberOf.Data))
	for i, memberOfData := range relData.MemberOf.Data {
		assert.Equal(t, "node", memberOfData.Type.entity())
		assert.Equal(t, "collection_object", memberOfData.Type.bundle())

		u = &JsonApiUrl{
			t:            t,
			baseUrl:      DrupalBaseurl,
			drupalEntity: memberOfData.Type.entity(),
			drupalBundle: memberOfData.Type.bundle(),
			filter:       "id",
			value:        memberOfData.Id,
		}
		memberCol := JsonApiCollection{}
		u.get(&memberCol)

		assert.Equal(t, expectedJson.MemberOf[i], memberCol.JsonApiData[0].JsonApiAttributes.Title)
	}
}

func Test_VerifyRepositoryItem(t *testing.T) {

}

func Test_VerifyMediaAndFile(t *testing.T) {

}

// Searches the file system for the named file.  The `name` should not contain any path components or separators.
//
// This function allows for an IDE to discover test resources while allowing for IDC test framework (the one invoked by
// `make test`) to discover those same resources without hard coding paths.  Instead, this function makes some
// assumptions about where tests are invoked from, and the directory structure underneath the TestBaseDir.
func findExpectedJson(t *testing.T, name string) string {
	// the resolved json file, including its path relative to the working directory.
	var expectedJsonFile string

	// attempt to discover TestBaseDir from the current working directory, which will work if we are invoked by the
	// IDC 'make test' target.
	filepath.Walk(".", func(path string, info os.FileInfo, err error) error {
		assert.Nil(t, err)
		// Resolve the expected json file relative to TestBaseDir (note the assumptions made about the directory structure)
		if info.IsDir() && info.Name() == TestBasedir {
			expectedJsonFile = filepath.Join(path, "verification", "expected", name)
			return errors.New(fmt.Sprintf("Found test basedir %s", path))
		}
		return nil
	})

	if expectedJsonFile != "" {
		return expectedJsonFile
	}

	// if the TestBaseDir is not found, that means we are probably being invoked from within that directory (e.g. by an
	// IDE or CLI)
	filepath.Walk(".", func(path string, info os.FileInfo, err error) error {
		assert.Nil(t, err)
		// Resolve the json file relative to the directory name `expected` (note the assumptions made about the directory
		// structure)
		if info.IsDir() && info.Name() == "expected" {
			expectedJsonFile = filepath.Join(path, name)
			return errors.New(fmt.Sprintf("Found test basedir %s", path))
		}
		return nil
	})

	assert.NotNil(t, expectedJsonFile)
	assert.NotEmpty(t, expectedJsonFile)
	return expectedJsonFile
}

// Locates the JSON file referenced by 'filename' and unmarshals it into the provided 'value'.  Any errors encountered
// will fail the test.
//
// Note that 'filename' should not contain any path components.  It is resolved to a path by
// findExpectedJson(...)
func unmarshalJson(t *testing.T, filename string, value interface{}) {
	expectedJsonFile := findExpectedJson(t, filename)
	expectedFile, err := os.Open(expectedJsonFile)
	defer func() { expectedFile.Close() }()
	assert.Nil(t, err, "Error opening file %s: %s", expectedJsonFile, err)

	// read expected json from file
	err = json.NewDecoder(expectedFile).Decode(value)
	assert.Nil(t, err, "Error decoding the content of file %s as JSON: %s", expectedJsonFile, err)
}

// Unmarshal a JSONAPI response body and assert that exactly one data element is present
func unmarshalSingleResponse(t *testing.T, body []byte, res *http.Response, value *JsonApiResponse) *JsonApiResponse {
	err := json.Unmarshal(body, value)
	assert.Nil(t, err, "Error unmarshaling JSONAPI response body: %s", err)
	assert.Equal(t, 1, len(value.Data), "Exactly one JSONAPI data element is expected in the response, but found %d element(s)", len(value.Data))
	return value
}

// Successfully GET the content at the URL and return the response and body.
func getResource(t *testing.T, u string) (*http.Response, []byte) {
	res, err := http.Get(u)
	log.Printf("Retrieving %s", u)
	assert.Nil(t, err, "encountered error requesting %s: %s", u, err)
	assert.Equal(t, 200, res.StatusCode, "%d status encountered when requesting %s", res.StatusCode, u)
	body, err := ioutil.ReadAll(res.Body)
	assert.Nil(t, err, "error encountered reading response body from %s: %s", u, err)
	return res, body
}
